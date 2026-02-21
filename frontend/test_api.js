async function testFetch() {
    console.log('Fetching from http://localhost:5000/api/tech-park/all without token purely to check route existence...');
    try {
        const response = await fetch('http://localhost:5000/api/tech-park/all');
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}
testFetch();
