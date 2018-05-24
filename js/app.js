(function() {
  'use strict';

  var FoodItem = Backbone.Model.extend({
    idAttribute: '_id',

    defaults: {
      id: '',
      name: '',
      brand: '',
      calories: 0,
      servingSize: 1,
      servingUnit: 'serving',
      selected: false
    }
  });

  var FoodCollection = Backbone.Collection.extend({

    model: FoodItem,

    initialize: function() {
      this.listenTo(Backbone, 'app:checkFoodCollection', this.checkEmpty);
    },

    checkEmpty: function() {
      _.each(this.models, item => { if (item) item.destroy(); });
      this.models.splice(0, 2);
      Backbone.trigger('app:clearFoodItemView');
    }
  });


  var InputView = Backbone.View.extend({

    el: '#search-food',

    events: {
      'submit' : 'search'
    },

    search: function(e) {
      e.preventDefault();
      this.searchText = $('#input-food').val();
      this.appId  = '34e0e1b7';
      this.appKey = 'a4b30fe7382b25b344cc70123484de67';
      this.query  = 'results=0:5&fields=item_name,brand_name,item_id,nf_calories';
      var url     = `https://api.nutritionix.com/v1_1/search/${this.searchText}?${this.query}&appId=${this.appId}&appKey=${this.appKey}`;

      fetch(url)
      .then(response => response.json())
      .then(function(result) {
        _.each(result.hits, function(item, ind) {

          var food = new FoodItem({
            name: item.fields.item_name,
            brand: item.fields.brand_name,
            calories: item.fields.nf_calories
          });

          foodCollection.add(food);
          Backbone.trigger('app:loadFoodCollection', food);
        });
      });
      Backbone.trigger('app:checkFoodCollection');
    }

  });


  var FoodItemView = Backbone.View.extend({

    initialize: function(item) {
      this.model = item;
      this.render();
    },

    events: {
      'click .add-item': 'addItem'
    },

    template: _.template($('#foodItem-template').html(), {variable: 'foodItem'}),

    addItem: function() {
      Backbone.trigger('app:addFoodItem', this.model);
      Backbone.trigger('app:updateTotalCalories', this.model.calories);
    },

    render: function() {
      if (this.model) {
        this.$el.html(this.template(this.model));
      }
      return this;
    }
  });


  var SelectedItemView = Backbone.View.extend({

    initialize: function(item) {
      this.model = item;
      if (this.model) this.model.selected = true;
      this.render();
    },

    events: {
      'click .remove-item': 'removeItem'
    },

    template: _.template($('#selectedItem-template').html(), {variable: 'foodItem'}),

    removeItem: function() {
      Backbone.trigger('app:removeFoodItem', this.model);
      this.remove();
    },

    render: function() {
      if (this.model) {
        this.$el.html(this.template(this.model));
      }
      return this;
    }
  });


  var CaloriesView = Backbone.View.extend({

    initialize: function() {
      this.total = $('#total span');
      this.totalCalories = 0;
    },

    render: function(calories) {
      this.totalCalories += calories;
      this.total.text(Math.round(this.totalCalories));
    }
  });


  var AppView = Backbone.View.extend({

    el: '#main',

    initialize: function() {
      this.buildUI();
    },

    buildUI: function() {
      this.inputView          = new InputView();
      this.foodItemView       = new FoodItemView();
      this.selectedItemView   = new SelectedItemView();
      this.totalCaloriesView  = new CaloriesView();

      this.listenTo(Backbone, 'app:addFoodItem', this.addSelectedItem);
      this.listenTo(Backbone, 'app:loadFoodCollection', this.updateFoodCollection);
      this.listenTo(Backbone, 'app:removeFoodItem', this.removeSelectedItem);
      this.listenTo(Backbone, 'app:updateTotalCalories', this.updateCalories);
      this.listenTo(Backbone, 'app:clearFoodItemView', this.clearAllFoodView);
    },

    updateFoodCollection: function(data) {
      var resultsBlock = $('#food-items');
      this.addFoodItem(resultsBlock, data.attributes)
    },

    addFoodItem: function(resultsBlock, item) {
      var foodItem = new FoodItemView(item);
      resultsBlock.append(foodItem.render().el);
    },

    clearAllFoodView: function() {
      $('#food-items').html('');
    },

    addSelectedItem: function(item) {
      var selectedBlock = $('#selected-items')
      var selectedItem  = new SelectedItemView(item);
      selectedBlock.append(selectedItem.render().el);
    },

    removeSelectedItem: function(item) {
      item.selected = false;
      this.updateCalories(-(item.calories));
    },

    updateCalories: function(calories) {
      this.totalCaloriesView.render(calories);
    }
  });

  var foodCollection = new FoodCollection();
  new AppView();

})();
