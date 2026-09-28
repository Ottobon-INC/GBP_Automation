async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/sales/pre-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: "Dr sujatha paidi",
        location: "Visakhapatnam",
        businessType: "healthcare",
        targetKeywords: ["best gynec"]
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response starts with:", text.substring(0, 2000));
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
