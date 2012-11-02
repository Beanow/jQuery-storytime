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
  
  
  /* ---------- Private attributes ---------- */
  
  var Resource = {
    image: {},
    audio: {},
    video: {},
    totalCount: 0,
    finishedLoading: 0
  };
  
  var Story = {
    chapter: 0,
    step: 0,
    stage: 0,
    options: {},
    container: null,
    initialized: false,
    nextStep: false,
    prevStep: false,
    latestMousehide: null
  };
  
  
  /* ---------- Initialization ---------- */
  
  //The main command interface.
  $.storytime = function()
  {
    
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
      effectSpeed: 200
      
    },options);
    
    //Set the container.
    //TODO: https://github.com/Beanow/jQuery-storytime/issues/9
    Story.container = $('body')[0];
    
    //Preload things.
    preloadResources(Story.options.resources);
    
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
      .on('keypress', function(e){
        if(e.keyCode == 13){
          e.preventDefault();
          nextStep();
        }
      })
      
      //Mouse moving
      .on('mousemove', function(e){
        
        $(Story.container).css('cursor', 'auto');
        
        if(Story.latestMouseHide)
          clearTimeout(Story.latestMouseHide);
        
        Story.latestMouseHide = setTimeout(function(){
          $(Story.container).css('cursor', 'none');
        }, 1500);
        
      })
      
    ;
    
  }
  
  function afterPreloading(){
    
    //Start the mouse hiding call right away.
    $(Story.container).trigger('mousemove');
    
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
  
  
  /* ---------- Resource handling ---------- */
  
  function preloadResources(resources){
    
    //When nothing is supplied, no loading is needed.
    if(!resources) return;
    
    //Let the world know we are loading things.
    $(Story.container).addClass('st-loading');
    
    //Images.
    if(resources.image)
      for(var key in resources.image)
        preloadImageResource(key, resources.image[key]);
    
    //Audio.
    if(resources.audio)
      for(var key in resources.audio)
        preloadAudioResource(key, resources.audio[key]);
    
    //Video.
    if(resources.video)
      for(var key in resources.video)
        preloadVideoResource(key, resources.video[key]);
    
  }
  
  function preloadProgressTick(){
    Resource.finishedLoading++;
    $(Story.container).find('.st-loading-progress').stop().animate({width:Math.round(Resource.finishedLoading / Resource.totalCount * 100)+'%'}, 150);
    if(Resource.finishedLoading == Resource.totalCount){
      setTimeout(function(arguments){
        $(Story.container).removeClass('st-loading');
        afterPreloading();
      }, 150);
    }
  }
  
  function preloadImageResource(key, url)
  {
    
    //Store information about this resource.
    var meta = Resource.image[key] = {
      url: url,
      ready: false
    };
    
    //Count this resource.
    Resource.totalCount++;
    
    //Create preloader.
    window.Image ? meta.preloader = new Image()
                 : meta.preloader = document.createElement('image');
    meta.preloader.onload = function(){
      meta.ready = true;
      preloadProgressTick();
      delete meta.preloader;
      debug('Finished preloading image.', meta);
    };
    
    //Start loading.
    meta.preloader.src = url;
    
    debug('Preloading image.', meta);
    
  }
  
  function preloadAudioResource(key, url)
  {
    
    //Store information about this resource.
    var meta = Resource.audio[key] = {
      url: url,
      ready: false
    };
    
    //Count this resource.
    Resource.totalCount++;
    
    //Create controller.
    window.Audio ? meta.controller = new Audio()
                 : meta.controller = document.createElement('audio');
    meta.controller.addEventListener('canplaythrough', function (){
      meta.ready = true;
      preloadProgressTick();
      debug('Finished preloading audio.', meta);
    }, true);
    meta.controller.preload = 'auto';
    
    //Start loading.
    meta.controller.src = url;
    meta.controller.load();
    
    debug('Preloading audio.', meta);
    
  }
  
  function preloadVideoResource(key, url)
  {
    
    //Store information about this resource.
    var meta = Resource.video[key] = {
      url: url,
      ready: false
    };
    
    //Count this resource.
    Resource.totalCount++;
    
    //Create controller.
    window.Video ? meta.controller = new Video()
                 : meta.controller = document.createElement('video');
    meta.controller.addEventListener('canplaythrough', function (){
      meta.ready = true;
      preloadProgressTick();
      debug('Finished preloading video.', meta);
    }, true);
    meta.controller.preload = 'auto';
    
    //Start loading.
    meta.controller.src = url;
    meta.controller.load();
    
    debug('Preloading video.', meta);
    
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
      effect($chapter(to), 'in');
    }
    
    //Switch steps with extra parameter.
    effect($step(Story), 'out', chapterTransitioning);
    effect($step(to), 'in', chapterTransitioning);
    
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
  
  function nextStage()
  {
    
    //TODO https://github.com/Beanow/jQuery-storytime/issues/1
    $(Story.container).removeClass('stage-'+Story.stage);
    Story.stage++;
    $(Story.container).addClass('stage-'+Story.stage);
    
  }
  
  
  /* ---------- Helper functions ---------- */
  
  function $chapter(options){
    return $(Story.container).find('#chapter-'+options.chapter);
  }
  
  function $step(options){
    return $(Story.container).find('#chapter-'+options.chapter+' .step-'+options.step);
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
