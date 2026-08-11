const { spawn } = require('child_process');

const testFiles = [
    'test/authControllers.test.js',
    'test/authValidation.test.js',
    'test/inventoryFull.test.js',
    'test/loginLogs.test.js',
    'test/lookupsControllers.test.js',
    'test/middlewares.test.js',
    'test/properties.test.js',
    'test/propertiesFull.test.js',
    'test/propertyLocations.test.js',
    'test/roomsFull.test.js',
    'test/serverIntegration.test.js',
    'test/swagger.test.js',
    'test/tokenCacheAndRoutes.test.js'
];

const proc = spawn(process.execPath, ['--test', '--experimental-test-coverage', ...testFiles], {
    stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
proc.stdout.on('data', (d) => { output += d.toString(); });
proc.stderr.on('data', (d) => { output += d.toString(); });

proc.on('close', (code) => {
    const lines = output.split('\n');
    const startIdx = lines.findIndex((l) => l.includes('start of coverage report'));
    if (startIdx !== -1) {
        console.log(lines.slice(startIdx).join('\n'));
    } else {
        console.log(output);
    }
});
