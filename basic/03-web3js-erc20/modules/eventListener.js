const Web3 = require('web3');

class EventListener {
    constructor(web3, contract) {
        this.web3 = web3;
        this.contract = contract;
        this.eventSubscriptions = new Map();
    }

    async subscribeToTransfers(options = {}) {
        try {
            console.log('Starting to listen for Transfer events...');

            const subscription = this.contract.events.Transfer(options)
                .on('data', (event) => {
                    console.log('Transfer event detected:');
                    console.log('  From:', event.returnValues.from);
                    console.log('  To:', event.returnValues.to);
                    console.log('  Amount:', event.returnValues.value);
                })
                .on('error', (error) => {
                    console.error('Transfer event listening error:', error);
                });

            this.eventSubscriptions.set('Transfer', subscription);
            return subscription;
        } catch (error) {
            console.error('Failed to setup Transfer event listener:', error);
            throw error;
        }
    }

    async getPastTransfers(fromBlock, toBlock = 'latest') {
        try {
            console.log(`Getting historical Transfer events from block ${fromBlock} to ${toBlock}...`);

            const events = await this.contract.getPastEvents('Transfer', {
                fromBlock,
                toBlock
            });

            events.forEach(event => {
                console.log('Historical Transfer event:');
                console.log('  From:', event.returnValues.from);
                console.log('  To:', event.returnValues.to);
                console.log('  Amount:', event.returnValues.value);
                console.log('  Block number:', event.blockNumber);
            });

            return events;
        } catch (error) {
            console.error('GET Historical Transfer event failed:', error);
            throw error;
        }
    }

    unsubscribeAll() {
        try {
            console.log('Cancel ALL subscription ...');
            this.eventSubscriptions.forEach((subscription) => {
                subscription.unsubscribe();
            });
            this.eventSubscriptions.clear();
        } catch (error) {
            console.error('Cancel subscription failed:', error);
            throw error;
        }
    }
}

module.exports = EventListener;