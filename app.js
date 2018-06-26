const baseUrl = "http://icebox.nobreakspace.org:8081/";    
const eventHub = new Vue();

// Distribute to components using global mixin
Vue.mixin({
    data: function () {
        return {
            eventHub: eventHub
        }
    }
})

const Overview = {
    template: '#overview-template'
}
Vue.component('overview', Overview);

const Keyboard = {
    template: '#keyboard-template',
    data: () =>({
        input: '',
        letters: ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    }),
    methods:{
        pressed(event){
            this.input += event.target.firstChild.data.toLowerCase();
        },
        changed(){
            this.eventHub.$emit('update',this.input);
        },
        deleteInput(){
            this.input = '';
            this.eventHub.$emit('update',this.input);
        }
    }
}
Vue.component('keyboard', Keyboard);

const Drinks =  {
    template: '#drinks-template',
    data: () => ({
        drinks: []
    }),
    mounted() {
        this.getDrinks();
    },
    methods: {
        getDrinks() {
            axios.get(baseUrl + `drinks`).then(response => {
                this.drinks = response.data
                this.drinks.map(drink => drink.image = 'img/bottle.png');
                console.log(this.drinks);
            }).catch(error => {
                console.log(error);
            })
        },        
        selectDrink(event){
            console.log('test');
            this.eventHub.$emit('drink-selected', event.target.value);
            
        }
    }
};
Vue.component('drinks', Drinks);

const Revert_order = {
    template: '#revert-order-template',
    data: () => ({
        selectedUser: null,
        selectedDrink: null,
        collapse: true
    }),
    mounted(){
        this.eventHub.$on('user-selected', username => {
            this.selectedUser = username;
        });
        this.eventHub.$on('drink-selected', drinkname => {
            console.log(drinkname);
            this.selectedDrink = drinkname;
        });          
    },
    methods:{
        deselectUser(){
            this.selectedUser = null;
            console.log('user deselected');
        },
        deselectDrink(){
            this.selectedDrink = null;
            console.log('drink deselected');
        }
    },
    computed:{
        collapsed(){
            if(this.selectedDrink === null && this.selectedUser === null){
                this.collapse = false;
                return false;
            }else{
                this.collapse = true;
                return true;
            }
        }
    }
}
Vue.component('revert-order', Revert_order); 

const Consumers = {
    template: '#consumers-template',
    data: () => ({
        consumers: [],
        filterString: ''
    }),
    computed:{
        filteredConsumers(){
            function startsWith(wordToCompare) {
                return function(string) {
                    return string.username.toLowerCase().indexOf(wordToCompare) === 0;
                }
            }
            console.log(this.filterString);
            return this.consumers.filter(
                startsWith(this.filterString)
            );
        }
    },
    mounted(){
        this.getConsumers();
        this.eventHub.$on('update', data => {
                this.filterString = data;
            });
    },
    methods: {
        getConsumers(){
            axios.get(baseUrl + `consumers`).then(response => {
                this.consumers = response.data
                console.log(this.consumers);
            }).catch(error => {
                console.log(error);
            })
        },
        selectConsumer(event){
            this.eventHub.$emit('user-selected', event.target.value);
            
        }
    }
};
Vue.component('consumers', Consumers);

const vue = new Vue();
var app = vue.$mount('#app');