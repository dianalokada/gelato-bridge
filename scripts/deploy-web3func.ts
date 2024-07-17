import { Web3FunctionBuilder } from '@gelatonetwork/web3-functions-sdk/builder';
import { Web3FunctionUploader } from '@gelatonetwork/web3-functions-sdk/uploader';

async function main() {
  try {
    // Build the Web3 Function
    const buildResult = await Web3FunctionBuilder.build('./web3Function/bridge/index.ts');
    console.log('Web3 Function built successfully');

    if (buildResult.success) {
      // Upload the built Web3 Function
      try {
        const cid = await Web3FunctionUploader.upload(
          buildResult.filePath,
          JSON.stringify(buildResult.schema), // Convert schema to string
          JSON.stringify({ metadata: { ...buildResult } }) // Convert metadata to string
        );
        console.log(`Web3 Function deployed with CID: ${cid}`);
      } catch (uploadError) {
        console.error('Upload failed:', uploadError);
      }
    } else {
      console.error('Build failed:', buildResult.error);
    }
  } catch (error) {
    console.error('Deployment process failed:', error);
    process.exit(1);
  }
}

main();