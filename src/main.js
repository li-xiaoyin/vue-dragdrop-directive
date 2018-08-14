let currentDragElement = null;

/**
 * 阻止事件冒泡。
 *
 * @param e 事件对象
 */
function stopPropagation(e) {
  e.stopPropagation ? e.stopPropagation() : (window.event.cancelBubble = true);
}

/**
 * 获取binding中的属性值。
 *
 * @param binding binding对象。
 * @param key 属性名。
 * @param defaultValue 默认值。
 * @returns {*} 属性值。
 */
function getPropValue(binding, key, defaultValue) {
  return binding.value == null || binding.value[key] == null
    ? defaultValue
    : binding.value[key];
}

/**
 * 监听dragstart事件。
 *
 * @param el 目标元素。
 */
function addStartListener(el) {
  function onDragStart(e) {
    // 阻止事件冒泡，否则有可能触发多次（比如容器和拖拽元素）。
    stopPropagation(e);
    // e.preventDefault(); // TODO IE下是否有不同的接口？

    e.dataTransfer.effectAllowed = "move";
    // 这里不能使用e.x，在FireFox下是undefined。
    e.target.__vueDndOriginX = e.clientX;
    e.target.__vueDndOriginY = e.clientY;

    // 下面是FireFox的bug，必须进行所谓的初始化才能拖拽，并且text/plain的值必须是空串，否则就更新浏览器地址了，感觉FireFox已经废了。
    // wrap in try catch to address IE's error when first param is 'text/plain'
    try {
      // setData is required for draggable to work in FireFox
      // the content has to be '' so dragging a node out of the tree won't open a new tab in FireFox
      e.dataTransfer.setData("text/plain", "");
    } catch (e) {
      // do noting.
    }

    // 这里向上找到draggable=true的元素，存入到全局变量中，因为在多拽过程中可能触发的不是自己的over，而是容器元素的over事件。
    // 不在这里保存，在over中就不知道当前拖拽的是谁了。
    // 这里大家可能认为移动过程中同步设置坐标的话，over元素仍然会一直保持在被拖拽元素中，这个如果移动速度过快的话，就不是了......
    currentDragElement = e.target;
    while (currentDragElement.draggable !== true) {
      currentDragElement = currentDragElement.parentNode;
    }

    // 拖拽显示元素。
    const dragImage = document.createElement("div");
    e.target.parentNode.append(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // TODO 这里有一个拖拽元素半透明效果，这里是不是开出一个css更合适，而且最新的一个被拖拽元素应该将x-index设置到最高，这里也需要考虑一下。
    // if (!currentDragElement.__vueDndScrollMode) {
    //   el.style.opacity = 0.6;
    // }
  }

  el.addEventListener("dragstart", onDragStart);
  // 保存在DOM元素上，方便在unbind移除。
  el.__vueDndStartHandler = onDragStart;
}

function handleDrag(handlers, container, distX, distY, e) {
  if (handlers == null) {
    return false;
  }

  if (typeof handlers === "function") {
    handlers(currentDragElement, container, distX, distY, e);
    return true;
  }

  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i].onDrag != null && handlers[i].match(currentDragElement)) {
      handlers[i].onDrag(currentDragElement, container, distX, distY, e);
      return true;
    }
  }
  return false;
}

function handleDrop(handlers, container, distX, distY, e) {
  if (handlers == null) {
    return false;
  }

  if (typeof handlers === "function") {
    return false;
  }

  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i].onDrop != null && handlers[i].match(currentDragElement)) {
      handlers[i].onDrop(currentDragElement, container, distX, distY, e);
      return true;
    }
  }
  return false;
}

/**
 * 监听dragover事件。<br />
 * 这里不能使用ondrag，在FireFox下ondrag取不到任何坐标值......
 *
 * @param el 目标元素。
 */
function addOverListener(el) {
  function onDragOver(e) {
    e.preventDefault();

    if (currentDragElement === null) {
      return;
    }

    const container = e.target;
    const distX = e.clientX - currentDragElement.__vueDndOriginX;
    const distY = e.clientY - currentDragElement.__vueDndOriginY;
    let matched;
    // 优先触发被拖拽元素上的handlers句柄。
    matched = handleDrag(
      currentDragElement.__vueDndHandler,
      container,
      distX,
      distY,
      e
    );
    // 如果被拖拽元素上没有匹配的句柄，查找拖拽容器上的拖拽句柄。
    if (!matched) {
      matched = handleDrag(el.__vueDndHandler, container, distX, distY, e);
    }
    // 如果没有任何匹配的句柄，默认行为是修改坐标。
    if (!matched) {
      const style = currentDragElement.style;
      style.left = parseInt(style.left === "" ? 0 : style.left) + distX + "px";
      style.top = parseInt(style.top === "" ? 0 : style.top) + distY + "px";
    }

    // 将原始坐标设置未当前坐标，下次将基于这个新坐标进行位移。
    currentDragElement.__vueDndOriginX = e.clientX;
    currentDragElement.__vueDndOriginY = e.clientY;
  }

  el.addEventListener("dragover", onDragOver);
  // 保存在DOM元素上，方便在unbind移除。
  el.__vueDndOverHandler = onDragOver;
}

/**
 * 监听dragend事件。
 *
 * @param el 目标元素。
 */
function addEndListener(el) {
  function onDragEnd(e) {
    // 阻止事件冒泡，否则有可能触发多次（比如容器和拖拽元素）。
    stopPropagation(e);
    e.preventDefault();
    // TODO 通过css实现
    // if (currentDragElement != null && !currentDragElement.__vueDndScrollMode) {
    //   el.style.opacity = 1;
    // }

    // 优先触发被拖拽元素上的handler句柄，如果被拖拽元素上没有匹配的句柄，查找拖拽容器上的拖拽句柄。
    if (!handleDrop(currentDragElement.__vueDndHandler, e)) {
      handleDrop(el.__vueDndHandler, e);
    }
    currentDragElement = null;
  }

  el.addEventListener("dragend", onDragEnd);
  el.__vueDndEndHandler = onDragEnd;
}

export default function install(Vue) {
  /**
   * 拖拽指令。<br />
   * 指令的默认属性可以理解为是一个可拖拽改变坐标的非容器元素。
   *
   * @param allowOver 是否监听dragover事件，默认为true。
   *                  vue-dnd默认运行在代理模式下，由容器监听所有子元素的拖拽行为，其中的元素只需要添加一个draggable="true"即可。
   * @param handler   拖拽句柄数组，因为vue-drag-drop默认运行在代理模式下，容器接管其中元素的拖拽事件，所以在这里需要声明其中各种拖拽元素的匹配规则和处理句柄。
   *                  handler可以是一个函数，也可以是一个对象或者一个对象数组，
   *                  当它是一个对象或者一个对象数组时，每个对象可能包括match、onDrag和onDrop三个函数，
   *                  如果是函数类型，则认为这个函数就是onDrag处理函数，直接调用。
   *                  如果是对象类型，则onDrag和onDrop必须提供其中一个，match无需提供，认为直接为true。
   *                  如果是数组类型，则match必须提供，它们的签名如下：
   *                  match(currentDragElement)：当前拖拽元素是否由本对象种的onDrag/onDrop处理。
   *                    currentDragElement: 当前拖拽元素
   *
   *                  onDrag(currentDragElement, container, distX, distY, e)：onDrag处理函数。
   *                    currentDragElement: 当前拖拽元素。
   *                    container：拖拽过程种，移动到的节点元素。
   *                    distX：横向移动距离。
   *                    distY：纵向移动距离。
   *                    e：DOM事件对象。
   *
   *                  onDrop(currentDragElement, container, distX, distY, e)：onDrop处理函数。
   *                    currentDragElement: 当前拖拽元素。
   *                    container：拖拽过程种，移动到的节点元素。
   *                    distX：横向移动距离。
   *                    distY：纵向移动距离。
   *                    e：DOM事件对象。
   */
  Vue.directive("drag-drop", {
    bind: function(el, binding) {
      const allowOver = getPropValue(binding, "allowOver", true);
      const handler = getPropValue(binding, "handler");

      el.__vueDndOriginX = 0;
      el.__vueDndOriginY = 0;
      el.__vueDndHandler = handler;

      // 监听事件。
      addStartListener(el);
      allowOver && addOverListener(el);
      addEndListener(el);
    },
    unbind: function(el) {
      el.removeEventListener("dragstart", el.__vueDndStartHandler);
      el.removeEventListener("dragover", el.__vueDndOverHandler);
      el.removeEventListener("dragend", el.__vueDndEndHandler);
      delete el.__vueDndOriginX;
      delete el.__vueDndOriginY;
      delete el.__vueDndHandler;
      delete el.__vueDndStartHandler;
      delete el.__vueDndOverHandler;
      delete el.__vueDndEndHandler;
    }
  });
}
