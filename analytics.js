(function () {
    // A reference to the global object.
    var root = this,
    // Whether analytics.js has been initialized.
        initialized = false,
    // Store the date when the page loaded, for analytics that depend on that.
        date = new Date();
    // Store window.onload state so that analytics that rely on it (ffs) can be
    // loaded even after it has happened.
        loaded = false,
        oldonload = window.onload;
        hasOwnProp = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        basicEmailRegex = /.+\@.+\..+/,
        PROTOCOL = window.location.protocol;


    window.onload = function () {
        loaded = true;
        if (isFunction(oldonload)) oldonload();
    };


    function getSeconds(time) {
        return Math.floor((new Date(time)) / 1000);
    };


    // A helper to shallow-ly clone objects, so that they don't get mangled or
    // added to by different analytics providers because of the reference.
    function clone(obj) {
        if (!obj) return;
        var clone = {};
        for (var prop in obj){

          if (hasOwnProp.call(obj, prop)) {
            clone[prop] = obj[prop];
          }
        }

        return clone;
    };

    function isPlainObject(obj) {
        return toString.call(obj) === '[object Object]';
    };

    function isString(obj) {
        return toString.call(obj) === '[object String]';
    }

    function isFunction(obj) {
        return toString.call(obj) === '[object Function]';
    };

    // Email detection helper.
    var isEmail = function (input) {
        return basicEmailRegex.test(input);
    };

    // A helper to resolve a settings object. It allows for `settings` to be an
    // `fieldName` string in the case of no additional settings being needed.
    // Field name is the setting for the api key for our shorthand.
    function resolveSettings(settings, fieldName) {

        if (!isString(settings) && !isPlainObject(settings))
            throw new Error('Encountered unresolvable settings value.');

        if (isString(settings)) {

            var apiKey = settings;
            settings = {};
            settings[fieldName] = apiKey;

        }

        return settings;

    };

    // helper to load a script before first script
    function loadScript(src, onload) {
      var sc = document.createElement('script'), before = document.getElementsByTagName('script')[0];
      sc.asnyc = true;
      sc.type = 'text/javascript';
      sc.src = PROTOCOL + src;

      before.parentNode.insertBefore(sc, before);
      before.onload = onload || before.onload;
      return before;
    }


    // The `analytics` object that will be exposed to you on the global object.
    root.analytics || (root.analytics = {

        // A list of providers that have been initialized.
        providers : [],

        // A `userId` to save.
        userId : null,


        // Initialize
        // ==========

        // Call **initialize** to setup analytics.js before identifying or
        // tracking any users or events. It takes a list of providers that you
        // want to enable, along with settings for each provider. (Settings vary
        // depending on the provider.) Here's what a call to **initialize**
        // might look like:
        //
        //     analytics.initialize({
        //         'Google Analytics' : 'UA-XXXXXXX-X',
        //         'Segment.io'       : 'XXXXXXXXXXX',
        //         'KISSmetrics'      : 'XXXXXXXXXXX'
        //     });
        //
        // `providers` - a dictionary of the providers you want to enabled. The
        // keys are the names of the providers and their values are the settings
        // they get passed on initialization.
        initialize : function (providers) {
            this.providers = [];
            for (var key in providers) {

              if (hasOwnProp.call(providers, key)) {

                if (!availableProviders[key]){
                  throw new Error('Couldn\'t find a provider named "'+key+'"');
                }

                availableProviders[key].initialize(providers[key]);
                this.providers.push(availableProviders[key]);

              }

            }

            initialized = true;
        },


        // Identify
        // ========

        // Identifying a user ties all of their actions to an ID you recognize
        // and records properties about a user. An example identify:
        //
        //     analytics.identify('user@example.com', {
        //         name : 'Achilles',
        //         age  : 23
        //     });
        //
        // `userId` - [optional] the ID you recognize your user by, like an email.
        //
        // `traits` - an optional dictionary of traits to tie your user. Things
        // like *Name*, *Age* or *Friend Count*.
        identify : function (userId, traits) {
            if (!initialized) return;

            if (isPlainObject(userId)) {
                traits = userId;
                userId = null;
            }

            // Save it for future use, or use saved userId.
            if (userId !== null)
                this.userId = userId;
            else
                userId = this.userId;

            for (var i = 0, provider; provider = this.providers[i]; i++) {

                if (!provider.identify) continue;
                provider.identify(userId, clone(traits));

            }

        },


        // Track
        // =====

        // Whenever a visitor triggers an event on your site that you're
        // interested in, you'll want to track it. An example track:
        //
        //     analytics.track('Added a Friend', {
        //         level  : 'hard',
        //         volume : 11
        //     });
        //
        // `event` - the name of the event. The best event names are human-
        // readable so that your whole team knows what they are when you analyze
        // your data.
        //
        // `properties` - an optional dictionary of properties of the event.
        track : function (event, properties) {
            if (!initialized) return;

            for (var i = 0, provider; provider = this.providers[i]; i++) {
                if (!provider.track) continue;
                provider.track(event, clone(properties));

            }
        }

    });




    // Providers
    // =========

    // A list of available providers that _can_ be initialized by you.
    var availableProviders = {

        // Google Analytics
        // ----------------
        // _Last updated: October 31st, 2012_
        //
        // [Documentation](https://developers.google.com/analytics/devguides/collection/gajs/).

        'Google Analytics' : {

            // Changes to the Google Analytics snippet:
            //
            // * Added optional support for `enhancedLinkAttribution`
            //
            // * Added optional support for `siteSpeedSampleRate`
            //
            // * Add `apiKey` to call to `_setAccount`.
            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'trackingId');
                var _gaq = _gaq || [];

                _gaq.push(['_setAccount', settings.trackingId]);

                if (this.settings.enhancedLinkAttribution === true) {
                    _gaq.push(['_require', 'inpage_linkid', (('https:' === PROTOCOL) ? 'https://ssl.' : 'http://www.') + 'google-analytics.com/plugins/ga/inpage_linkid.js']);
                }

                if (this.settings.siteSpeedSampleRate != null && typeof(this.settings.siteSpeedSampleRate) === 'number') {
                    _gaq.push(['_setSiteSpeedSampleRate', this.settings.siteSpeedSampleRate]);
                }

                _gaq.push(['_trackPageview']);
                loadScript('//google-analytics.com/ga.js');
                window._gaq = _gaq;
            },

            track : function (event, properties) {
                window._gaq.push(['_trackEvent', 'All', event]);
            }
        },


        // KISSmetrics
        // -----------
        // _Last updated: September 27th, 2012_
        //
        // [Documentation](http://support.kissmetrics.com/apis/javascript).

        'KISSmetrics' : {

            // Changes to the KISSmetrics snippet:
            //
            // * Concatenate in the `apiKey`.
            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'apiKey');
                var _kmq = _kmq || [];

                function _kms(u){
                    setTimeout(function(){
                      loadScript(u);
                    }, 1);
                }
                _kms('//i.kissmetrics.com/i.js');
                _kms('//doug1izaerwt3.cloudfront.net/'+ settings.apiKey +'.1.js'); // Add API key from settings.

                window._kmq = _kmq;
            },

            // KISSmetrics uses two separate methods: `identify` for storing the
            // `userId` and `set` for storing `traits`.
            identify : function (userId, traits) {
                if (userId)
                  window._kmq.push(['identify', userId]);
                if (traits)
                  window._kmq.push(['set', traits]);
            },

            track : function (event, properties) {
                window._kmq.push(['record', event, properties]);
            }
        },


        // Mixpanel
        // --------
        // _Last updated: September 27th, 2012_
        //
        // [Documentation](https://mixpanel.com/docs/integration-libraries/javascript),
        // [documentation](https://mixpanel.com/docs/people-analytics/javascript),
        // [documentation](https://mixpanel.com/docs/integration-libraries/javascript-full-api).

        'Mixpanel' : {

            // Changes to the Mixpanel snippet:
            //
            // * Use window for call to `init`.
            // * Add `apiKey` and `settings` args to call to `init`.
            //
            // Also, we don't need to set the `mixpanel` object on `window` because
            // they already do that.
            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'token');

                (function(c,a){window.mixpanel=a;var b,d,h,e;b=c.createElement("script");
                b.type="text/javascript";b.async=!0;b.src=("https:"===c.location.protocol?"https:":"http:")+
                '//cdn.mxpnl.com/libs/mixpanel-2.1.min.js';d=c.getElementsByTagName("script")[0];
                d.parentNode.insertBefore(b,d);a._i=[];a.init=function(b,c,f){function d(a,b){
                var c=b.split(".");2==c.length&&(a=a[c[0]],b=c[1]);a[b]=function(){a.push([b].concat(
                Array.prototype.slice.call(arguments,0)))}}var g=a;"undefined"!==typeof f?g=a[f]=[]:
                f="mixpanel";g.people=g.people||[];h=['disable','track','track_pageview','track_links',
                'track_forms','register','register_once','unregister','identify','name_tag',
                'set_config','people.identify','people.set','people.increment'];for(e=0;e<h.length;e++)d(g,h[e]);
                a._i.push([b,c,f])};a.__SV=1.1;})(document,window.mixpanel||[]);
                window.mixpanel.init(settings.token, settings);
            },


            // Only identify with Mixpanel's People feature if you opt-in because
            // otherwise Mixpanel charges you for it.
            // Alias email -> $email
            identify : function (userId, traits) {
                if (userId) {
                    window.mixpanel.identify(userId);
                    window.mixpanel.name_tag(userId);

                    if (isEmail(userId)) {
                        traits = traits || {};
                        traits.email = userId;
                    }
                }

                if (traits) {
                    window.mixpanel.register(this.aliasTraits(traits));
                }

                if (this.settings.people === true) {
                    if (userId)
                        window.mixpanel.people.identify(userId);
                    if (traits)
                        window.mixpanel.people.set(traits);
                }
            },


            // much more efficient to copy traits over to new obj
            // and discard the old one
            aliasTraits : function (traits) {

              var transformed = {};
              for(var k in traits) {
                if (hasOwnProp.call(traits,k)){

                  (function(key, trait){
                    transformed['$' + key] = trait;
                  }(k,traits[k]));

                }
              }

              return transformed;

            },

            track : function (event, properties) {
                window.mixpanel.track(event, properties);
            }
        },


        // Intercom
        // --------
        // _Last updated: September 27th, 2012_
        //
        // [Documentation](http://docs.intercom.io/).

        'Intercom' : {

            // Intercom identifies when the script is loaded, so instead of
            // initializing in `initialize`, we have to initialize in `identify`.
            initialize: function (settings) {
                this.settings = resolveSettings(settings, 'appId');
            },

            // Changes to the Intercom snippet:
            //
            // * Add `appId` from stored `settings`.
            // * Add `userId`.
            identify: function (userId, traits) {
                // Don't do anything if we just have traits.
                if (!userId) return;

                window.intercomSettings = {
                    app_id      : this.settings.appId,
                    user_id     : userId,
                    custom_data : traits || {},
                };

                if (traits) { // undefiend === undefined; so we don't need to check
                    window.intercomSettings.email = traits.email; 
                    window.intercomSettings.name = traits.name;
                    window.intercomSettings.created_at = getSeconds(traits.createdAt);
                } else if (isEmail(userId)) {
                    window.intercomSettings.email = userId;
                }

                function async_load() {
                  loadScript('//api.intercom.io/api/js/library.js');
                }

                if (window.attachEvent) {
                    window.attachEvent('onload', async_load);
                } else {
                    window.addEventListener('load', async_load, false);
                }
            }
        },


        // Customer.io
        // ----------
        // _Last updated: December 6th, 2012_
        //
        // [Documentation](http://customer.io/docs/api/javascript.html).

        'Customer.io' : {

            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'siteId');

                var _cio = _cio || [];

                (function() {
                    var a,b,c;a=function(f){return function(){_cio.push([f].
                    concat(Array.prototype.slice.call(arguments,0)))}};b=["identify",
                    "track"];for(c=0;c<b.length;c++){_cio[b[c]]=a(b[c])};

                    var s = loadScript('//assets.customer.io/assets/track.js');
                    s.id = 'cio-tracker';
                    s.setAttribute('data-site-id', settings.siteId);

                })();

                window._cio = _cio;
            },

            identify : function (userId, traits) {
                // Don't do anything if we just have traits.
                if (!userId) return;

                var properties = clone((traits || {}));
                properties.id = userId;
                properties.email = (properties.email === undefined && isEmail(userId)) ? userId : properties.email;

                if (properties.createdAt) {
                    properties.created_at = getSeconds(properties.createdAt);
                    delete properties.createdAt;
                }

                window._cio.identify(properties);
            },

            track : function (event, properties) {
                window._cio.track(event, properties);
            }
        },


        // CrazyEgg.com
        // ----------
        // _Last updated: December 6th, 2012_
        // API Key is the xxxx/xxxx in "//dnn506yrbagrg.cloudfront.net/pages/scripts/xxxx/xxxx.js"
        // [Documentation](www.crazyegg.com).

        'CrazyEgg' : {

            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'apiKey');

                (function(){
                    loadScript("//dnn506yrbagrg.cloudfront.net/pages/scripts/"+settings.apiKey+".js?"+Math.floor(new Date().getTime()/3600000));
                })();
            }
        },



        // Olark
        // -----
        // _Last updated: October 11th, 2012_
        //
        // [Documentation](http://www.olark.com/documentation).

        'Olark' : {

            // Changes to the Olark snippet:
            //
            // * Removed `CDATA` tags.
            // * Add `siteId` from stored `settings`.
            // * Added `window.` before `olark.identify`.
            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'siteId');

                window.olark||(function(c){var f=window,d=document,l=f.location.protocol=="https:"?"https:":"http:",z=c.name,r="load";var nt=function(){f[z]=function(){(a.s=a.s||[]).push(arguments)};var a=f[z]._={},q=c.methods.length;while(q--){(function(n){f[z][n]=function(){f[z]("call",n,arguments)}})(c.methods[q])}a.l=c.loader;a.i=nt;a.p={0:+new Date};a.P=function(u){a.p[u]=new Date-a.p[0]};function s(){a.P(r);f[z](r)}f.addEventListener?f.addEventListener(r,s,false):f.attachEvent("on"+r,s);var ld=function(){function p(hd){hd="head";return["<",hd,"></",hd,"><",i,' onl' + 'oad="var d=',g,";d.getElementsByTagName('head')[0].",j,"(d.",h,"('script')).",k,"='",l,"//",a.l,"'",'"',"></",i,">"].join("")}var i="body",m=d[i];if(!m){return setTimeout(ld,100)}a.P(1);var j="appendChild",h="createElement",k="src",n=d[h]("div"),v=n[j](d[h](z)),b=d[h]("iframe"),g="document",e="domain",o;n.style.display="none";m.insertBefore(n,m.firstChild).id=z;b.frameBorder="0";b.id=z+"-loader";if(/MSIE[ ]+6/.test(navigator.userAgent)){b.src="javascript:false"}b.allowTransparency="true";v[j](b);try{b.contentWindow[g].open()}catch(w){c[e]=d[e];o="javascript:var d="+g+".open();d.domain='"+d.domain+"';";b[k]=o+"void(0);"}try{var t=b.contentWindow[g];t.write(p());t.close()}catch(x){b[k]=o+'d.write("'+p().replace(/"/g,String.fromCharCode(92)+'"')+'");d.close();'}a.P(2)};ld()};nt()})({loader: "static.olark.com/jsclient/loader0.js",name:"olark",methods:["configure","extend","declare","identify"]});
                window.olark.identify(settings.siteId);
            },

            identify : function (userId, traits) {
                if (!userId) return;

                window.olark('api.chat.updateVisitorNickname', {
                    snippet : userId
                });
            },

            track : function (event, properties) {
                if (!this.settings.track) return;

                window.olark('api.chat.sendNotificationToOperator', {
                    body : 'Visitor triggered "'+event+'".'
                });
            }

        },


        // Chartbeat
        // ---------
        // _Last updated: November 27th, 2012_
        //
        // [Documentation](http://chartbeat.com/docs/adding_the_code/),
        // [documentation](http://chartbeat.com/docs/configuration_variables/),
        // [documentation](http://chartbeat.com/docs/handling_virtual_page_changes/).

        'Chartbeat' : {

            // Changes to the Chartbeat snippet:
            //
            // * Add `apiKey` and `domain` variables to config.
            // * Added conditionals for extra settings.
            // * Replaced the date with our stored `date` variable.
            // * Dealt with reliance on window.onload, so that Chartbeat can be
            //   initialized after the page has loaded.
            //
            // Also, we don't need to set the `mixpanel` object on `window` because
            // they already do that.
            initialize : function (settings) {
                this.settings = settings = resolveSettings(settings, 'uid');

                var _sf_async_config={};
                /** CONFIGURATION START **/
                _sf_async_config.uid    = settings.uid;
                _sf_async_config.domain = settings.domain || window.location.host;
                if (settings.path)         _sf_async_config.path         = settings.path;
                if (settings.title)        _sf_async_config.title        = settings.title;
                if (settings.useCanonical) _sf_async_config.useCanonical = settings.useCanonical;
                if (settings.sections)     _sf_async_config.sections     = settings.sections;
                if (settings.authors)      _sf_async_config.authors      = settings.authors;
                if (settings.noCookies)    _sf_async_config.noCookies    = settings.noCookies;
                /** CONFIGURATION END **/
                (function(){
                    window._sf_endpt = date.getTime();
                    loadScript((("https:" == document.location.protocol) ?
                            "https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/" :
                            "http://static.chartbeat.com/") +
                            "js/chartbeat.js");
                })();
            }

            // TODO: Add virtual page API.
        }
    };


}).call(this);
