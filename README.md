jQuery Storytime
================

jQuery Storytime is a plugin that turns a page into a story telling engine.


Basic setup
-----------

1. Include the jQuery and jQuery Storytime js files.
2. Add an initialization token when DOM is ready. Example:
```javascript
    jQuery(function($){
      
      //Initialize our story.
      $.storytime({
        effect: 'fade',
        effectSpeed: 600,
        hideCursor: 1500
      });
      
    });
```

3. Have at least one chapter and one step defined in the body. Example:
```html
    <article id="chapter-1" class="chapter">
      <section class="step-1 step">First step of the first chapter.</section>
    </article>
```

Controls
--------

From there on the `Enter` key will be used to go to the next step.

Besides that you have the option to either use classes to bind the standard controls or call them in javascript.
```html
<!-- Bind default events through classes -->
<a href="#" class="st-next-step">This goes to the next step</a>
<a href="#" class="st-prev-step">This goes to the previous step</a>
<a href="#" class="st-to-chapter" data-chapter="1">This goes to chapter 1</a>
```
```javascript
//Execute commands in javascript.
$.storytime('nextStep'); //Goes to the next step.
$.storytime('prevStep'); //Goes to the previous step.
$.storytime('toChapter', 1); //Goes to chapter 1.
```
