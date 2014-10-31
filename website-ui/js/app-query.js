app.factory('Query', 
[ '$$organisms', '$$networks', '$$attributes', 'util', '$$genes', 'Query_genes', 'Query_history', 'Query_networks', 'Query_attributes', 'Result',
function( $$organisms, $$networks, $$attributes, util, $$genes, Query_genes, Query_history, Query_networks, Query_attributes, Result ){
  var copy = util.copy;
  var strcmp = util.strcmp;

  // list of query submodules to inject
  var qmods = [ Query_genes, Query_history, Query_networks, Query_attributes ];

  var organisms;
  var networkGroups;
  var attributeGroups;

  // when all resources are pulled in, the query is ready
  Promise.all([
    
    $$organisms().then(function( orgs ){
      organisms = orgs;
    }),

    $$networks().then(function( nets ){
      networkGroups = nets;
    }),

    $$attributes().then(function( attrs ){
      attributeGroups = attrs;
    })

  ]).then(function(){
    // current query (only one at a time)
    q.current = new q();
    qfn.ready = true;

    console.log('Query ready');
    PubSub.publish('query.ready', q.current);
  });

  PubSub.subscribe('ready', function(){
    qfn.appReady = true;
  });

  function Query( opts ){
    if( !(this instanceof Query) ){
      return new Query( opts );
    }

    // set defaults
    var self = this;

    self.organisms = copy( organisms );
    self.organism = _.find( self.organisms, function( o ){ // default org is human
      return o.id === 4;
    } ) || self.organisms[0]; // fallback on first org

    self.networkSortFactors = config.networks.sorters;
    self.setNetworkOptions = config.networks.setters;
    self.weighting = config.networks.defaultWeighting;

    self.setOrganism( self.organism, false ); // update org related deps

    self.sortNetworksBy('first author');
  };
  var q = Query;
  var qfn = q.prototype;

  // ref some stuff into query
  qfn.weightings = config.networks.weightings; // flat list of weighting types
  qfn.weightingGroups = config.networks.weightingGroups; // categorised groups of weightings used in ui
  qfn.$$search = $$search;

  // 
  // EXPANDING AND COLLAPSING THE QUERY INTERFACE

  qfn.expanded = true;

  qfn.collapse = function(){
    qfn.expanded = false;
  };

  qfn.expand = function(){
    qfn.expanded = true;
  };

  qfn.toggleExpand = function(){
    qfn.expanded = !qfn.expanded;
  };
  

  //
  // ORGANISM

  qfn.setOrganism = function( org, pub ){ 
    var self = this;

    this.organism = org;

    self.networkGroups = copy( networkGroups[ self.organism.id ] );
    self.organism.networkGroups = self.networkGroups;
    self.networkGroupsById = {};

    self.networks = [];
    self.networksById = {};
    for( var i = 0; i < self.networkGroups.length; i++ ){
      var group = self.networkGroups[i];
      var nets = group.interactionNetworks;
      var selCount = 0;

      group.expanded = false;

      self.networkGroupsById[ group.id ] = group;

      if( nets ){ for( var j = 0; j < nets.length; j++ ){
        var net = nets[j];

        self.networks.push( net );
        self.networksById[ net.id ] = net;

        net.group = group;
        net.selected = net.defaultSelected;
        net.expanded = false;

        if( net.selected ){
          selCount++;
        }

      } }

      group.selectedCount = selCount;

      self.updateNetworkGroupSelection( group );
      
    }

    self.attributeGroups = copy( attributeGroups[ self.organism.id ] );
    self.organism.attributeGroups = self.attributeGroups;
    self.attributeGroupsById = {};

    var selCount = 0;
    for( var i = 0; i < self.attributeGroups.length; i++ ){
      var group = self.attributeGroups[i];

      group.selected = group.defaultSelected;
      group.expanded = false;

      if( group.selected ){
        selCount++;
      }

      self.attributeGroupsById[ group.id ] = group;
    }

    self.selectedAttributeGroupCount = selCount;
    self.attributeGroupsExpanded = false;
    self.updateAttributeGroupsSelection();

    if( pub === undefined || pub ){
      PubSub.publish('query.setOrganism', self);
    }

    this.validateGenes(); // new org => new genes validation
  };


  //
  // WEIGHTING

  qfn.setWeighting = function( w ){
    this.weighting = w;
  };

  qfn.toggleEditWeighting = function(){
    this.editingWeighting = this.editingWeighting ? false : true;
  };


  //
  // MAX RETURN PARAMS

  // results genes size
  qfn.setMaxGenes = function( max ){
    this.maxGenes = max;
  };

  // results attrs size
  qfn.setMaxAttrs = function( max ){
    this.maxAttrs = max;
  };

  // inject the individual query submodules
  for( var i = 0; i < qmods.length; i++ ){
    qmods[i]( q );
  }

  return q;

} ]);


app.controller('QueryCtrl',
[ '$scope', 'updateScope', 'Query', 
function( $scope, updateScope, Query ){

  // initialise once whole app is ready
  function init(){
    window.query = $scope.query = Query.current;

    updateScope();
  }

  PubSub.subscribe('ready', init);
  PubSub.subscribe('query.searchResult', init);

  PubSub.subscribe('query.validateGenes', updateScope);
  PubSub.subscribe('query.validateGenesStart', updateScope);
  PubSub.subscribe('query.describeGeneLine', updateScope);

  PubSub.subscribe('query.setGenesText', _.debounce(function(){
    updateScope();
  }, 50, {
    leading: true
  }));

  PubSub.subscribe('query.setGenesTextFromCode', _.debounce(function(){
    updateScope();
    $scope.query.updateGenesArea();
  }, 50, {
    leading: true
  }));

  // PubSub.subscribe('query.toggleNetworkGroupExpansion', updateScope);
  // PubSub.subscribe('query.toggleNetworkExpansion', updateScope);
  // PubSub.subscribe('query.toggleNetworkGroupSelection', updateScope);
  // PubSub.subscribe('query.toggleNetworkSelection', updateScope);
  PubSub.subscribe('query.toggleNetworkCheckOptions', updateScope);
  PubSub.subscribe('query.toggleNetworkSortOptions', updateScope);
  PubSub.subscribe('query.sortNetworksBy', updateScope);
  PubSub.subscribe('query.setNetworks', updateScope);

  PubSub.subscribe('ready', updateScope);

  PubSub.subscribe('result.searched', updateScope);
  PubSub.subscribe('result.cancel', updateScope);
  PubSub.subscribe('$$search.progress', updateScope);
  
  $scope.respRestyle = function(){ // allow access to resp restyle inside template
    responsive.restyle();
  };

} ]);