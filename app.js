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

const Keyboard = {
    template: '#keyboard-template',
    data: () =>({
        input: '',
        letters: ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    }),
    methods:{
        pressed(event){
            this.input += event.target.firstChild.data.toLowerCase();
            this.eventHub.$emit('update',this.input);
        },
        deleteInput(){
            this.input = '';
            this.eventHub.$emit('update',this.input);
        }
    }
}

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
        }
    }
};

const Orderpanel = {
    template: '#orderpanel-template'
}

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
                    return string.username.indexOf(wordToCompare) === 0;
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
        }
    }
};

Vue.component('orderpanel', Orderpanel);
Vue.component('consumers', Consumers);
Vue.component('drinks', Drinks);
Vue.component('keyboard', Keyboard);
Vue.component('overview', Overview);


const vue = new Vue();
var app = vue.$mount('#app');

