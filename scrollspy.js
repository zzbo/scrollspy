/**
 * @file 滚动侦测组件<br />
 * @version 1.1.0.20130222
 * @author zhenbo.zheng
 */

//ScrollSpy
;(function(){
    'use strict';

    (function (factory) {
        if (typeof define === 'function' && define.amd) {
          return define(['jquery'], factory);
        } else {
          return factory(window.jQuery);
        }
    })(function ($) {
        var name = 'jscrollspy';

        function Plugin(node, options){
            this._init(node, options);
        }

        Plugin.prototype = {
            _init : function (node, options) {
                var self = this;

                this.timeStamp = +new Date();

                if (options.target) {
                    options.node = $(options.target);
                }
                else {
                    options.node = $(node);
                }

                //合并配置选项
                this.options = $.extend({
                    trigger : null,
                    panel : null,
                    diffHeight : 0,
                    triggerType : 'click',
                    reverse : true,
                    activeCls : 'cur',
                    isAlwaysCall : true,
                    spyEvent : null,
                    noSpyEvent : null,
                    clickEvent : null
                }, options);
                
                $(window).resize(function(){
                    self._expands();
                });
                
                this._expands().
                    _bindScroll().
                    _bindClickScroll();
            },
            _expands : function(trigger, panel) {
                var tempObj,
                    that = this,
                    options = this.options,
                    trigger = trigger || options.trigger,
                    panel = panel || options.panel,
                    triggerDomArray = this.triggerDomArray = $(trigger),
                    panelDomArray = this.panelDomArray = $(panel),
                    spyArray = that._spyArray;

                    //refresh
                    if (arguments.length == 0) {
                        spyArray = [];
                    }

                    for(var i = 0, len = panelDomArray.length; i < len; i++) {
                        tempObj = {};
                        tempObj.triggerDom = triggerDomArray.eq(i);
                        tempObj.panelDom = panelDomArray.eq(i);
                        tempObj.startDiffHeight = tempObj.panelDom.data('startDiffHeight') || 0;
                        tempObj.endDiffHeight = tempObj.panelDom.data('endDiffHeight') || 0;
                        tempObj.startPoint = tempObj.panelDom.offset().top;
                        tempObj.endPoint = tempObj.startPoint + tempObj.panelDom.height();

                        spyArray.push(tempObj);
                    }

                    this._spyArray = spyArray;
                    return this;
            },
            push : function(trigger, panel) {
                this._expands(trigger, panel);
            },
            refresh : function () {
                this._expands();
            },
            setDiffHeight : function (value) {
                this.options.diffHeight = value;
            },
            _scrollEvent : function() {
                var i,
                    len,
                    spyObject,
                    _scrollTop,
                    _spyArray = this._spyArray,
                    curObject = this.curObject,
                    options = this.options,
                    node = options.node,
                    scrollTop = node.scrollTop(),
                    isInFlag = false,
                    triggerDomArray = this.triggerDomArray,
                    activeCls = options.activeCls;

                    _scrollTop = scrollTop + options.diffHeight;

                    for (i = 0, len = _spyArray.length; i < len; i++) {
                        spyObject = _spyArray[i];
                        //滚动高度在开始值和结束值之间
                        if (_scrollTop >= spyObject.startPoint - spyObject.startDiffHeight &&
                            _scrollTop < spyObject.endPoint + spyObject.endDiffHeight) {

                            if (options.isAlwaysCall) {
                                triggerDomArray.removeClass(activeCls);
                                spyObject.triggerDom.addClass(activeCls);

                                if(options.spyEvent) {
                                    options.spyEvent.call(spyObject);
                                }
                            }
                            else {
                                if (curObject != spyObject) {
                                    triggerDomArray.removeClass(activeCls);
                                    spyObject.triggerDom.addClass(activeCls);

                                    if(options.spyEvent) {
                                      options.spyEvent.call(spyObject);
                                    }

                                  this.curObject = spyObject;
                                }
                            }
                            isInFlag = true;
                        }
                    }

                    if(!isInFlag) {
                        if (options.noSpyEvent && $.isFunction(options.noSpyEvent)) {
                            options.noSpyEvent();
                        }
                        curObject = null;
                    }

                return this;
            },
            _bindScroll : function() {
                var t,
                    self = this,
                    t_start = +new Date(),
                    options = this.options,
                    timeStamp = this.timeStamp,
                    scrollEvent = function () {
                        //用于减少函数执行次数，提高性能
                        var t_cur = +new Date();
                        clearTimeout(t);

                        if (t_cur - t_start > 120) {
                            self._scrollEvent();
                            t_start = t_cur;
                        }
                        else {
                            t = setTimeout(function () {
                                self._scrollEvent();
                            }, 100);
                        }
                    }

                //给目标对象绑定滚动事件
                options.node.on('scroll.spy_' + this.timeStamp, scrollEvent);
                //fix opera
                this._scrollEvent();

                return this;
            },
            _bindClickScroll : function() {
                var i,
                    len,
                    scrollToPoint,
                    func,
                    options = this.options,
                    triggerType = options.triggerType + '.spy_' + this.timeStamp,
                    triggerDomArray = this.triggerDomArray,
                    _spyArray = this._spyArray;
                    

                if (!options.reverse) {
                    return this;
                }

                for (i = 0, len = triggerDomArray.length; i < len; i++) {
                    func = (function (i) {
                        return function () {
                            var spyObject = _spyArray[i],
                                clickEvent = options.clickEvent;

                            if (!spyObject) {
                                window.console && console.log('can not find the match content wrap');
                                return false;
                            }
                            
                            $('html, body').stop(true, true).animate({
                                scrollTop: spyObject.startPoint - options.diffHeight - spyObject.startDiffHeight
                            }, 600);

                            if (clickEvent && $.isFunction(clickEvent)) {
                                clickEvent.call(spyObject);
                            }
                        }
                    })(i);

                    triggerDomArray.eq(i)
                        .off(triggerType)
                        .on(triggerType, func);
                }

                return this;
            }
        }

        $.fn[name] = function(arg) {
            var instance,
                type = $.type(arg),
                args,
                methods;

            if (type === "object") {
              if (this.length && !$.data(this, name)) {
                instance = new Plugin(this, arg);
                $(this).each(function() {
                    $.data(this, name, instance);
                });
              }
              return this;
            }

            if (type === "string" && arg === "destroy") {
              instance.destroy();
              this.each(function() {
                $.removeData(this, name);
              });
              return this;
            }

            if (type === 'string' && arguments.length > 1) {
                methods = $(this).data(name);
                args = Array.prototype.slice.call(arguments, 1);
                
                methods[arguments[0]].apply(methods, args);
                //$.data(this, name)[arguments[0]]();
            }
            return this;
        };

    });
})();

