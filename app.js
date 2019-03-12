/*jshint esversion: 6 */

/*
Copyright (c) 2018 Johannes Christian Gosch
Permission is hereby granted, free of charge,
to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const baseUrl = "http://icebox.nobreakspace.org:8081/";    
const eventHub = new Vue();

//Eventually you want to use VueX instead of this rudiment source of truth
const state = {
    drinks:[],
    consumers: [],
    selectedUser: null,
    selectedDrink: null,
    drinkCursor: {},
    undoParameters: {},



    findDrinkByBarcode (barcode){
        return this.drinks.find(drink => drink.barcode === barcode);
    },

    getDrink(){
        if(this.selectedDrink != null){
            return this.findDrinkByBarcode(this.selectedDrink);
        }else{
            return null;
        }
    },
};

Vue.config.debug = false;
Vue.config.devtools = false;

//Eventually you want to use VueX instead of a global eventHub...
Vue.mixin({
    data: function () {
        return {
            state:state,
            eventHub: eventHub,
        };
    },
    methods:{
        getDrinks() {
            axios.get(baseUrl + `drinks`).then(response => {
                response.data.map(drink => drink.image = 'img/'+drink.barcode+'.png');
                response.data = response.data.filter(function(drink){
                    if(drink.quantity > 0){
                        return drink; 
                    }
                });
                this.state.drinks = response.data;

                console.log(response.data);
            }).catch(error => {
                console.log(error);
            });
            
        },
        getConsumers(){
            axios.get(baseUrl + `consumers`).then(response => {
                console.log(response.data);
                this.state.consumers = response.data;
            }).catch(error => {
                console.log(error);
            });
        }
    },
});

const Overview = {
    template: '#overview-template',
    data:()=>({
        showConsumers: true
    }),
    inherit: true,
    mounted(){
        this.eventHub.$on('user-selected',data => {
            this.showConsumers = false;
        });

        this.eventHub.$on('user-deselected',data => {
            this.showConsumers = true;
        });
        this.eventHub.$on('bought',data =>{
            this.getDrinks();
        });

    
    },
};
Vue.component('overview', Overview);

const Keyboard = {
    template: '#keyboard-template',
    data: () =>({
        filterinput: '',
        letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] }),
    inherit: true,
    methods:{
        pressed(event){
            this.filterinput += event.target.firstChild.data.toLowerCase();
            this.changed();
        },
        changed(){
            this.eventHub.$emit('update',this.filterinput);
        },
        deleteInput(){
            this.filterinput = '';
            this.eventHub.$emit('update',this.filterinput);
        }
    },
    mounted(){
        this.eventHub.$on('bought', data => {
            this.filterinput = '';
        });
        this.eventHub.$on('notbought', data => {
            this.filterinput = '';
        });
    }
};
Vue.component('keyboard', Keyboard);

const Drinks =  {
    template: '#drinks-template',
    props: ['inventur'],
    data: () => ({
        state: state
    
    }),
    mounted() {
        this.getDrinks();
        this.eventHub.$on('bought', data => {
            this.getDrinks();
        });
    },
    inherit: true,
    methods: {      
        selectDrink(barcode){
            this.eventHub.$emit('drink-selected', barcode);
            //console.log(event);
        }
    },
};
Vue.component('drinks', Drinks);

const Revert_order = {    
    template: '#revert-order-template',
    inherit: true,
    collapsed: true,
    data: () => ({
        dismissSecs: 10,
        dismissCountDown: 0,
        selectedUser: state.selectedUser,
        selectDrink: state.selectedDrink
    }),
    mounted(){
        this.eventHub.$on('user-selected', user => {
            console.log(user);
            this.state.selectedUser = user;
        });
        this.eventHub.$on('drink-selected', drink => {
            this.state.selectedDrink = drink;
        });          
    },
    methods:{
        deselectUser(){
            this.state.selectedUser=null;
            console.log('user deselected');
            this.eventHub.$emit('user-deselected');
            
        },
        deselectDrink(){
            this.state.selectedDrink = null;
            console.log('drink deselected');
        },
        countDownChanged (dismissCountDown) {
            this.dismissCountDown = dismissCountDown;
          },
        hideAlert(){
            this.dismissCountDown = 0;
        },
        showAlert () {
            this.dismissCountDown= this.dismissSecs;
        },
        unbuy(){
            console.log(this.state.undoParameters);
            console.log(JSON.stringify(this.state.undoParameters));
            this.hideAlert();

            axios.delete(baseUrl+'consumptions',JSON.stringify(this.state.undoParameters)).then(response => {
            
                this.eventHub.$emit('bought');
        }).catch(error => {
            this.$root.$emit('bv::show::modal','error');
            console.log(error);
        });

        },
        buy(){
            postData = {                
                "barcode": this.state.selectedDrink,
                "username": this.state.selectedUser.username
            
            };
            if(postData.username == 'Anon'){
              postData.username = null;
            }
            axios.post(baseUrl+'consumptions', postData ).then(response => {
            this.state.undoParameters = response.data.undoparameters;
            console.log(response);
            this.showAlert();

        }).catch(error => {
  
            this.$root.$emit('bv::show::modal','error');
            this.eventHub.$emit('notbought');

        });
            this.eventHub.$emit('bought');
            this.getConsumers();
            this.getDrinks();
            this.deselectDrink();
            this.deselectUser();
        }
    },
    watch:{
        selectedUser : function(oldV,newV){
            console.log(newV);
        },
        selectedDrink: function(old,newV){
            console.log(newV);
        }
    
    },
    computed:{
        collapsed(){
            return (this.state.selectedUser != null || this.state.selectedDrink != null );
        },
        selectedDrinkName(){
            if(this.state.selectedDrink !== null && this.state.selectedDrink !== undefined){
                return this.state.findDrinkByBarcode(this.state.selectedDrink).name;
            }else{
                return '';
            }
        },
        selectedUserName(){
            if(this.state.selectedUser != null){
                return this.state.selectedUser.username;
            }else{
                return '';
            }
        }
    }
};
Vue.component('revert-order', Revert_order); 

const Consumers = {
    template: '#consumers-template',
    data: () => ({
        filterString: '',
    }),
    computed:{
        filteredConsumers(){
            function startsWith(wordToCompare) {
                return function(string) {
                    return string.username.toLowerCase().indexOf(wordToCompare) === 0;
                };
            }
            console.log(this.filterString);
            return this.state.consumers.filter(
                startsWith(this.filterString)
            );
        }
    },
    mounted(){
        this.getConsumers();
        this.eventHub.$on('update', data => {
                this.filterString = data;
            });
            this.eventHub.$on('notbought', data => {
                this.filterString = '';
            });
            this.eventHub.$on('bought', data => {
                this.filterString = '';
            });
    },
    inherit: true,
    methods: {
        selectConsumer(consumer){
            this.eventHub.$emit('user-selected', consumer);
            
        }
    }
};
Vue.component('consumers', Consumers);

const Inventur = {
    template: '#inventur-template',

};
Vue.component('inventur', Inventur);

const router = new VueRouter({
    routes: [
        {
            path: '/',
            name: 'overview',
            components: {
                main: Overview,
                navbar: Revert_order
            },
        },
        {
            path: '/inventur',
            name: 'inventur',
                components:{
                    main: Inventur
                }
        }
    ]
  });
  

const vue = new Vue({
    router
});
var app = vue.$mount('#app');
