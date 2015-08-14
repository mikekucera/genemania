'use strict';

// if templates not built, then define a dummy module
(function(){
  var templates;

  try {
    templates = angular.module('templates');
  } catch (e) {
    templates = angular.module('templates', []);
  }
})();

var app = angular.module('app', ['templates', 'pasvaz.bindonce', 'pragmatic-angular']);

PubSub.promise = function( topic ){
  return new Promise(function( resolve ){
    PubSub.subscribe(topic, function( arg ){
      resolve( arg );
    });
  });
};

(function(){
  // when all pieces of the ui are ready, then the app overall is ready
  var readyPromise = Promise.all([
    PubSub.promise('query.ready'),

    new Promise(function( resolve ){
      window.addEventListener('load', function(){ console.log('Window ready'); resolve(); });
    })
  ])
    .then(function(){
      console.log('GeneMANIA app ready');
      PubSub.publish('ready'); // all app ready
    })
  ;

  var lazyPromise = new Promise(function( resolve ){

    readyPromise.then(function(){ // wait until app all ready before lazy loading libs
      require(['js-build/lazy.js'], function( lazy ){
        console.log('Lazy loaded libs pulled in');

        resolve( lazy );
      });
    });

  });

  window.lazyLib = function(){ return lazyPromise; };
})();

// because angularjs depends on this and it's not reliable
window.scrollTo = window.scrollTo || function(){};

app.factory('updateScope', [ '$timeout', '$rootScope', function( $timeout, $rootScope ){
  var lastUpdate;

  return function(){
    if( lastUpdate ){ return; clearTimeout(lastUpdate); }

    lastUpdate = setTimeout(function(){ lastUpdate = null; $rootScope.$apply(); }, 16);
  }

  function updateScope(){
    if( lastUpdate ){ $timeout.cancel(lastUpdate); }

    lastUpdate = $timeout(function(){ lastUpdate = null; }, 16);
  }

  return updateScope;
} ]);

app.controller('SplashCtrl', ['$scope', 'updateScope', function( $scope, updateScope ){

  PubSub.promise('query.ready').then(function(){
    $scope.ready = true;

    updateScope();
  });

  PubSub.promise('query.search').then(function(){
    $scope.splashed = true;

    updateScope();
  });

} ]);
