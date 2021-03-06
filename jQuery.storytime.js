/**
 * jQuery Storytime is a plugin that turns a page into a story telling engine.
 * Please note only one instance can be used and it assumes it's free to use the whole body as it's playground.
 * For more information view the wiki on the github repository.
 *
 * @version 1.1-stable
 * @author Beanow
 * @licence MIT
 * @website https://github.com/Beanow/jQuery-storytime
 */

(function($){
  
  
  /* ---------- Private attributes ---------- */
  var Story = {
    chapter: 0,
    step: 0,
    stage: null,
    options: {},
    container: null,
    initialized: false,
    nextStep: false,
    prevStep: false,
    latestMouseHide: null,
    latestMousePos: null
  };
  
  
  /* ---------- Initialization ---------- */
  
  //The main command interface.
  $.storytime = function(){
    
    //When this is our first call, we're setting up our options.
    if(!Story.initialized)
      initialize(arguments[0]);
    
    //Otherwise, this is a command. Switch based on that.
    else switch(arguments[0])
    {
      
      //Command toChapter
      case 'toChapter': toChapter(arguments[1]); break;
      
      //Command nextStep
      case 'nextStep': nextStep(); break;
      
      //Command prevStep
      case 'prevStep': prevStep(); break;
      
      //Command setStage
      case 'setStage': setStage(arguments[1]); break;

      //Command setOptions
      case 'setOptions': $.extend(Story.options, arguments[1]); break;
      
      default: debug('Unknown storytime command:', arguments[0]); break;
      
    }
    
  };
  
  //Initializes the story with given options.
  function initialize(options)
  {
    
    //Set the options, overriding any defaults here.
    $.extend(Story.options, {
      
      //Default options.
      debugging: false,
      effectSpeed: 200,
      hideCursor: false,
      events: {}
      
    }, options);
    
    //Set the container.
    //TODO: https://github.com/Beanow/jQuery-storytime/issues/9
    Story.container = $('body')[0];
    
    //Bind events.
    $(Story.container)
      
      //To chapter
      .on('click', '.st-to-chapter', function(e){
        e.preventDefault();
        toChapter($(this).attr('data-chapter'));
      })
      
      //Prev step
      .on('click', '.st-prev-step', function(e){
        e.preventDefault();
        prevStep();
      })
      
      //Next step
      .on('click', '.st-next-step', function(e){
        e.preventDefault();
        nextStep();
      })

      //Key navigation
      .on('keypress', function(e){

        //Next (Enter, right arrow)
        if(e.keyCode == 13 || e.keyCode == 39){
          e.preventDefault();
          nextStep();
          return;
        }

        //Prev (Left arrow)
        if(e.keyCode == 37){
          e.preventDefault();
          prevStep();
          return;
        }

      })
      
      //Mouse moving
      .on('mousemove', function(e){
        
        //If we set no to hide the cursor, skip this.
        if(!Story.options.hideCursor) return;

        //Ignore the event if the mouse did not actually move.
        //WebKit workaround. https://code.google.com/p/chromium/issues/detail?id=103041
        if(
          Story.latestMousePos &&
          Story.latestMousePos.x == e.pageX &&
          Story.latestMousePos.y == e.pageY
        ) return;

        $(Story.container).removeClass('no-cur');
        
        if(Story.latestMouseHide)
          clearTimeout(Story.latestMouseHide);
        
        Story.latestMouseHide = setTimeout(function(){
          $(Story.container).addClass('no-cur');
        }, Story.options.hideCursor);

        //Store latest position, to ignore the mousemove event from cursor changes.
        //WebKit workaround. https://code.google.com/p/chromium/issues/detail?id=103041
        Story.latestMousePos = {
          x: e.pageX,
          y: e.pageY
        };

      })
      
    ;

    //Start the mouse hiding call right away if we want cursor hiding.
    if(Story.options.hideCursor)
      $(Story.container).trigger('mousemove');
    
    //Mark the story as initialized.
    Story.initialized = true;
    
    //Go to the first step of the first chapter.
    Story.nextStep = {
      chapter: 1,
      step: 1
    };
    nextStep();
    
  }
  
  
  /* ---------- Effects ---------- */
  
  function effect($el, action, chapterTransitioning)
  {
    
    switch(Story.options.effect)
    {
      
      //Fade effect.
      case 'fade': switch(action){
        case 'in': chapterTransitioning ? $el.show() : $el.fadeIn(Story.options.effectSpeed); break;
        case 'out': chapterTransitioning ? $el.delay(Story.options.effectSpeed).fadeOut(1) : $el.fadeOut(Story.options.effectSpeed); break;
      } break;
      
      default: debug('Unknown effect applied:', Story.options.effect); break;
      
    }
    
  }
  
  
  /* ---------- Events ---------- */
  
  function trigger(eventName, options){
    
    var cb = Story.options.events[eventName];
    if(cb){
      cb.call(cb, options.chapter, options.step, Story.options.effectSpeed);
      debug('Triggering event', eventName);
    }
    
  }
  
  
  /* ---------- Navigation ---------- */
  
  function findNextStep()
  {
    
    //Find the next step in this chapter.
    var next = {
      chapter: Story.chapter,
      step: Story.step+1
    };
    
    //If it's there, return.
    if($step(next).size() == 1)
      return next;
    
    //If it's not, go to the next chapter.
    next.chapter++;
    next.step = 1;
    
    //If it's there, return.
    if($step(next).size() == 1)
      return next;
    
    //Otherwise, there's no next step.
    return false;
    
  }
  
  function findPrevStep()
  {
    
    //Find the previous step in this chapter.
    var prev = {
      chapter: Story.chapter,
      step: Story.step-1
    };
    
    //If it's there, return.
    if($step(prev).size() == 1)
      return prev;
    
    //If it's not, go to the previous chapter.
    prev.chapter--;
    
    //If it's not there, there's no previous step.
    if($chapter(prev).size() == 0)
      return false;
    
    //Otherwise, find the last step of the chapter.
    prev.step = 1;
    $chapter(prev).find('.step').each(function(){
      
      //Match the step-# pattern to find out which step this is.
      //Because we don't assume steps to be placed in order of step in the DOM.
      var result = /step-([0-9]+)/.exec($(this).attr('class'));
      var stepNr = parseInt(result[1],10);
      if(stepNr > prev.step) prev.step = stepNr;
      
    });
    
    return prev;
    
  }
  
  function nextStep()
  {
    
    if(!Story.nextStep){
      debug('No next step for:', 'Chapter '+Story.chapter, 'Step '+Story.step);
      return;
    }
    
    transition(Story.nextStep);
    
  }
  
  function prevStep()
  {
    
    if(!Story.prevStep){
      debug('No prev step for:', 'Chapter '+Story.chapter, 'Step '+Story.step);
      return;
    }
    
    transition(Story.prevStep);
    
  }
  
  function transition(to)
  {
    
    var chapterTransitioning = Story.chapter != to.chapter;
    
    //If we're switching chapters.
    if(chapterTransitioning){
      effect($chapter(Story), 'out');
      trigger('leave chapter', Story);
      trigger('leave chapter '+Story.chapter, Story);
      effect($chapter(to), 'in');
      trigger('enter chapter', to);
      trigger('enter chapter '+to.chapter, to);
    }
    
    //Switch steps with extra parameter.
    effect($step(Story), 'out', chapterTransitioning);
    trigger('leave chapter step', Story);
    trigger('leave chapter '+Story.chapter+' step', Story);
    trigger('leave chapter step '+Story.step, Story);
    trigger('leave chapter '+Story.chapter+' step '+Story.step, Story);
    effect($step(to), 'in', chapterTransitioning);
    trigger('enter chapter step', to);
    trigger('enter chapter '+to.chapter+' step', to);
    trigger('enter chapter step '+to.step, to);
    trigger('enter chapter '+to.chapter+' step '+to.step, to);
    
    //Update story data.
    $.extend(Story, to);
    Story.prevStep = findPrevStep();
    Story.nextStep = findNextStep();
    
    //Add class if there's no next or prev step.
    $(Story.container).toggleClass('st-no-next', !Story.nextStep);
    $(Story.container).toggleClass('st-no-prev', !Story.prevStep);
    
  }
  
  function toChapter(chapter)
  {
    
    try{
      chapter = parseInt(chapter, 10);
    }catch(e){
      return debug('Given chapter value for toChapter() is not an integer.');
    }
    
    var target = {
      chapter: chapter,
      step: 1
    };
    
    if($chapter(target).size() == 0)
      return debug('Chapter '+chapter+' does not exist. It needs id="chapter-'+chapter+'".');
    
    if($step(target).size() == 0)
      return debug('Chapter '+chapter+' does not have a step 1.');
    
    transition(target);
    
  }
  
  
  /* ---------- Staging ---------- */
  
  function setStage(name)
  {
    
    if(Story.stage)
      effect($stage(Story.stage), 'out');

    Story.stage = name;

    if(Story.stage)
      effect($stage(Story.stage), 'in');
    
  }
  
  
  /* ---------- Helper functions ---------- */
  
  function $chapter(options){
    return $(Story.container).find('#chapter-'+options.chapter);
  }
  
  function $step(options){
    return $(Story.container).find('#chapter-'+options.chapter+' .step-'+options.step);
  }

  function $stage(name){
    return $(Story.container).find('#stage-'+name);
  }
  
  //Log messages for debugging your stories.
  function debug()
  {
    
    if(!Story.options.debugging)
      return;
    
    if(console && console.log){
      console.log('Debug log', arguments);
    }
    
    else
      alert(arguments.join('\r\n\t'));
    
  }
  
})(jQuery);
