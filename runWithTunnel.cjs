/* eslint-disable */

const ngrok = require('ngrok');
const { spawn } = require('child_process');
const process = require('process');

// Read environment variables for ngrok configuration
const authtoken = process.env.NGROK_AUTH_TOKEN;
const subdomain = process.env.NGROK_SUBDOMAIN;

(async () => {
  try {
    // Connect to ngrok and create a tunnel to port 3000
    await ngrok.authtoken(authtoken);
    const url = await ngrok.connect({
      proto: 'http',
      addr: 3000,
      subdomain: subdomain,
      authtoken: authtoken,
    });

    console.log(`ngrok tunnel created at ${url}`);

    // Set URL and FORCE_COLOR environment variables for the yarn process
    const yarnEnv = Object.assign({}, process.env, {
      URL: `https://${subdomain}.ngrok.io`,
      FORCE_COLOR: 1,
    });

    // Run 'yarn dev' as a shell process with inherited stdio and route stdout and stderr
    const shellProcess = spawn('yarn', ['dev'], { stdio: 'inherit', env: yarnEnv });

    // Forward interrupt signal to shell process and close ngrok tunnel
    process.on('SIGINT', async () => {
      console.log('\nClosing ngrok tunnel and shell process...');

      shellProcess.kill('SIGINT');

      // await ngrok.disconnect();
      await ngrok.kill();

      process.exit();
    });
  } catch (error) {
    console.error('Error creating ngrok tunnel or running yarn dev:', error);
    process.exit(1);
  }
})();
