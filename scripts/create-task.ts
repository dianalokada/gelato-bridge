const { GelatoRelay } = require('@gelatonetwork/relay-sdk');

async function createTask() {
  const relay = new GelatoRelay();

  const task = await relay.createTask({
    name: 'My Web3 Function Task',
    web3FunctionHash: 'YOUR_WEB3_FUNCTION_CID',
    web3FunctionArgs: {
      // function arguments
    },
    trigger: {
      interval: 300, // Run every 5 minutes, for example
    },
  });

  console.log(`Task created with ID: ${task.id}`);
}

createTask().catch(console.error);
