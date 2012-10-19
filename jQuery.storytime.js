/**
 * jQuery Storytime is a plugin that turns a page into a story telling engine.
 * Please note only one instance can be used and it assumes it's free to use the whole body as it's playground.
 * For more information view the wiki on the github repository.
 *
 * @author Beanow
 * @licence MIT
 * @website https://github.com/Beanow/jQuery-storytime
 */

(function($){
  
  var Story = {
    chapter: 0,
    step: 0,
    stage: 0,
    options: {},
    initialized: false,
    nextStep: false,
    prevStep: false,
    latestMousehide: null
  };
  
  //Initializes the story with given options.
  function initialize(options)
  {
    
    //Set the options, overriding any defaults here.
    $.extend(Story.options, {
      
      //Default options.
      debugging: false,
      effectSpeed: 200
      
    },options);
    
    //Bind events.
    $(document)
      
      //Next step
      .on('click', '.st-next-step', function(e){
        e.preventDefault();
        nextStep();
      })
      .on('keypress', function(e){
        if(e.keyCode == 13){
          e.preventDefault();
          nextStep();
        }
      })
      
      //Mouse moving
      .on('mousemove', function(e){
        
        $('body').css('cursor', 'auto');
        
        if(Story.latestMouseHide)
          clearTimeout(Story.latestMouseHide);
        
        Story.latestMouseHide = setTimeout(function(){
          $('body').css('cursor', 'none');
        }, 1500);
        
      })
      
    ;
    
    //Start the mouse hiding call right away.
    $(document).trigger('mousemove');
    
    //Mark the story as initialized.
    Story.initialized = true;
    
    //Go to the first stage.
    nextStage();
    
    //Go to the first step of the first chapter.
    Story.nextStep = {
      chapter: 1,
      step: 1
    };
    nextStep();
    
  }
  
  function $chapter(options){
    return $('#chapter-'+options.chapter);
  }
  
  function $step(options){
    return $('#chapter-'+options.chapter+' .step-'+options.step);
  }
  
  function effect($el, action, chapterTransitioning)
  {
    
    switch(Story.options.effect)
    {
      
      //Fade effect.
      case 'fade': switch(action){
        case 'in': chapterTransitioning ? $el.show() : $el.fadeIn(Story.options.effectSpeed); break;
        case 'out': if(!chapterTransitioning) $el.fadeOut(Story.options.effectSpeed); break;
      } break;
      
      default: debug('Unknown effect applied:', Story.options.effect); break;
      
    }
    
  }
  
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
  
  function nextStep()
  {
    
    if(!Story.nextStep){
      debug('No next step for:', 'Chapter '+Story.chapter, 'Step '+Story.step);
      return;
    }
    
    var chapterTransitioning = Story.chapter != Story.nextStep.chapter;
    
    //If we're switching chapters.
    if(chapterTransitioning){
      effect($chapter(Story), 'out');
      effect($chapter(Story.nextStep), 'in');
    }
    
    //Switch steps with extra parameter.
    effect($step(Story), 'out', chapterTransitioning);
    effect($step(Story.nextStep), 'in', chapterTransitioning);
    
    //Update story data.
    $.extend(Story, Story.nextStep);
    Story.nextStep = findNextStep();
    
  }
  
  function nextStage()
  {
    
    //TODO https://github.com/Beanow/jQuery-storytime/issues/1
    $('body').removeClass('stage-'+Story.stage);
    Story.stage++;
    $('body').addClass('stage-'+Story.stage);
    
  }
  
  //The main command interface.
  $.storytime = function()
  {
    
    //When this is our first call, we're setting up our options.
    if(!Story.initialized)
      initialize(arguments[0]);
    
    //Otherwise, this is a command. Switch based on that.
    else switch(arguments[0])
    {
      
      //Command nextStep
      case 'nextStep': nextStep(); break;
      
      //Command setOptions
      case 'setOptions': $.extend(Story.options, arguments[1]); break;
      
      default: debug('Unknown storytime command:', arguments[0]); break;
      
    }
    
  };
  
  //Log messages for debugging your stories.
  function debug()
  {
    
    if(!Story.options.debugging)
      return;
    
    if(console && console.log)
      console.log.apply(this, arguments);
    
    else
      alert(arguments.join('\r\n\t'));
    
  }
  
})(jQuery);
