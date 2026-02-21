const { execSync } = require('child_process');

try {
    const stdout = execSync('netstat -ano | findstr :5000').toString();
    const lines = stdout.split('\n');
    const pids = new Set();

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4 && parts[1].includes(':5000')) {
            const pid = parts[parts.length - 1];
            if (pid !== '0' && pid !== '') {
                pids.add(pid);
            }
        }
    });

    if (pids.size === 0) {
        console.log('No active process on port 5000.');
    } else {
        pids.forEach(pid => {
            console.log(`Killing PID ${pid}...`);
            try {
                execSync(`taskkill /F /PID ${pid}`);
                console.log(`Successfully killed ${pid}.`);
            } catch (e) {
                console.error(`Could not kill ${pid}: ${e.message}`);
            }
        });
    }
} catch (error) {
    if (error.status === 1) {
        console.log('No process found on port 5000.');
    } else {
        console.error('Error finding process:', error.message);
    }
}
