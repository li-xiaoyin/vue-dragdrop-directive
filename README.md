# vue-dragdrop-directive

## Installation

```shell
# will publish after 2018-08-15 15:00
npm install vue-dragdrop-directive
```

### register in .js file:

```javascript
import vueDragDrop from "vue-dragdrop-directive";

Vue.use(vueDragDrop);
```

## Typical use

### Movement

```vue
<!--
	v-drag-drop run in delegate mode by default.
	all of elements which has draggable="true" can be fire drag event under the v-drag-drop.
-->
<template>
	<div v-drag-drop class="container">
        <div draggable="true" class="draggable"></div>
    </div>
</template>

<style>
    .container {
        width: 800px; 
        height: 800px;
    }
    
    .draggable {
        /* v-dragdrop is a basic lib, you must write absolute your self*/ 
        position: absolute; 
        width: 100px; 
        height: 100px; 
        background-color: dodgerblue;
    }
</style>
```

### Resize

```vue
<template>
	<div v-drag-drop="{handler:resizeHandler}" class="container">
        <div class="resizable">
            <!-- in this case draggable attribute set to a resize handler. -->
            <div draggable="true" class="resizer"></div>
    	</div>
    </div>
</template>

<script>
    export default {
        /**
         *	key point, v-drag-drop can set a props named "handler",
         * 	in this case handler is a function, when it is a function, it will be called on drag
         * 	
         *	@param el the dom element which on drag.
         *	@param container the dom element which mouse over in the container.
         *	@param distX the horizontal distance of mouse movement.
         *	@param distY the vertical distance of mouse movement.
         *	@param e the dom event object of "ondragover"
         */
        resizeHandler(el, container, distX, distY, e) {
            const style = el.parentNode.style;
            style.width = parseInt(style.width) + distX + "px";
            style.height = parseInt(style.height) + distY + "px";
            
            // you also can change scroll position like following code:
            // const parent = el.parentNode;
            // parent.scrollTo(parent.scrollLeft - distX, parent.scrollTop - distY);
        }
    }
</script>

<style>
    .container {
        width: 800px; 
        height: 800px;
    }
    
    .resizable {
        /* v-dragdrop is a basic lib, you must write absolute your self*/ 
        position: absolute; 
        width: 100px; 
        height: 100px; 
        background-color: dodgerblue;
    }
    
    .resizer {
        cursor: se-resize; 
        width: 11px; 
        height: 11px; 
        position: absolute; 
        background-color: yellow; 
        font-size: 0.1px; 
        display: block; 
        z-index: 90;
        right: 0;
        bottom: 0;
    }
</style>
```

## Props

v-dragdrop support the following props：

* allowOver (default is true)

  when it is false, the dom can not be listen ondragover event on the dom.

* handler (default is undefined)

  handler is an extensibility, it can be write in three forms:

  * Function

    when it is a function, it will be called on drag. 

  * Object

    **coming soon.**

    when it is a object, it will be contains two functions like following, requires at least one .

    ```javascript
    {
        onDrag(currentDragElement, container, distX, distY, e) {
    		// call on drag.
        },
        onDrop(currentDragElement, e) {
             // call on drop.
        }
    }
    ```

  * Array

    when it is a array, the element must be a object which contains three functions like following:

    ```javascript
    {
        match(currentDragElement) {
            // is required in array mode.
            // decide if onDrag/onDrop can be called for this element(currentDragElement)
        },
        onDrag(currentDragElement, container, distX, distY, e) {
    		// call on drag.
        },
        onDrop(currentDragElement, e) {
             // call on drop.
        }
    }
    ```

    

    