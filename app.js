const baseUrl = "http://icebox.nobreakspace.org:8081/";    
    
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
            },
            deleteInput(){
                this.input = '';
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

    const Consumers = {
        template: '#consumers-template',
        data: () => ({
            consumers: []
        }),
        mounted(){
            this.getConsumers();
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


    Vue.component('consumers', Consumers);
    Vue.component('drinks', Drinks);
    Vue.component('keyboard', Keyboard);
    Vue.component('overview', Overview);
    console.log(Vue);
    
    
    const vue = new Vue();
    var app = vue.$mount('#app');

	