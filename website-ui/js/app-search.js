app.factory('$$search', 
['$http', 'util',
function( $http, util ){

  var doneTimeout;
  var fakeProgInt;

  // organism : id of org
  // genes : newline separated list of genes
  // weighting : network weighting scheme
  // geneThreshold : max number of genes to return
  // attrThreshold : max number of attributes to return
  // networks : array of network ids to use in search
  // attrGroups : array of attribute group ids to use in search
  var $$search = window.$$search = function( opts ){
    return new Promise(function( resolve, reject ){
      var oReq = $$search.request = new XMLHttpRequest();
      var tStart = Date.now();
      var t100;
      var t100Val = 1.5;
      var deltaT = 100;

      // handle progress
      clearTimeout( doneTimeout );
      $$search.progress = 0;
      oReq.upload.addEventListener("progress", function(e){
        // console.log(e)

        if( e.lengthComputable ){
          var ratio = e.loaded / e.total;
          
          $$search.progress = Math.round( t100Val * ratio );

          if( ratio === 1 ){
            t100 = Date.now();

            fakeProgressUntilLoad();
          }
        }

        PubSub.publish('$$search.progress', $$search);
      }, false);

      function fakeProgressUntilLoad(){
        fakeProgInt = setInterval(function(){
          var tNow = Date.now();
          var t100Duration = t100 - tStart;
          var duration = tNow - t100;
          var addedProgress = duration/t100Duration * t100Val;

          $$search.progress = t100Val + addedProgress;
          $$search.progress = Math.min( $$search.progress, 100 ); // bound to 100

          PubSub.publish('$$search.progress', $$search);
        }, deltaT);
      }
      
      // handle success
      oReq.addEventListener("load", function(e){
        // console.log(e)
        // console.log(oReq);
        // console.log('LOAD TIME, T100 TIME');
        // console.log( Date.now() - tStart, t100 - tStart );

        $$search.progress = 100;
        clearInterval( fakeProgInt );

        PubSub.publish('$$search.progress', $$search);

        clearTimeout( doneTimeout );
        doneTimeout = setTimeout(function(){
          $$search.progress = 0;

          PubSub.publish('$$search.progress', $$search);
        }, 2*deltaT);

        setTimeout(function(){
          resolve( JSON.parse( oReq.responseText ) );
        }, deltaT);
      }, false);

      // handle errors
      oReq.addEventListener("error", reject, false);
      oReq.addEventListener("abort", reject, false);

      // send req
      oReq.open( 'POST', config.service.baseUrl + 'search_results', true );
      oReq.setRequestHeader('Content-Type', 'application/json');
      oReq.send( JSON.stringify(opts) );
    }).cancellable().catch(function( err ){
      if( $$search.request ){
        $$search.request.abort();
      }

      $$search.progress = 0;
      clearTimeout( doneTimeout );
      clearInterval( fakeProgInt );

      throw err;
    });
  };

  return $$search;

}]);