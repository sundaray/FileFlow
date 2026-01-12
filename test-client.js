import fs from "node:fs";
import path from "node:path";

// Configuration
const API_URL = "http://localhost:3001/api";
const FILE_PATH = "./test/fixtures/sample.csv";

// 1. Define the Pipeline
// We will: Parse CSV -> Filter for "USA" -> Uppercase Names -> Convert to JSON
const pipelineConfig = {
  stages: [
    {
      id: "1",
      type: "csv-parser",
      enabled: true,
      options: { delimiter: ",", hasHeaders: true, skipEmptyLines: true },
    },
    {
      id: "2",
      type: "filter",
      enabled: true,
      options: { field: "country", operator: "equals", value: "USA" },
    },
    {
      id: "3",
      type: "uppercase",
      enabled: true,
      options: { fields: ["name"] },
    },
    {
      id: "4",
      type: "json-stringify",
      enabled: true,
      options: { pretty: false },
    },
  ],
};

async function runTest() {
  console.log("🚀 Starting Test...");

  // 2. Check if file exists
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`Error: File not found at ${FILE_PATH}`);
    return;
  }

  const fileStats = fs.statSync(FILE_PATH);
  const fileStream = fs.createReadStream(FILE_PATH);

  // 3. Upload File
  console.log("📤 Uploading file...");
  try {
    // Note: We use 'duplex: half' because we are sending a stream
    const uploadRes = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: {
        "x-filename": "sample.csv",
        "x-pipeline-config": JSON.stringify(pipelineConfig),
        "Content-Type": "application/octet-stream", // Important for raw binary
        "Content-Length": fileStats.size.toString(),
      },
      body: fileStream,
      duplex: "half",
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(`Upload failed: ${JSON.stringify(err)}`);
    }

    const uploadData = await uploadRes.json();
    const jobId = uploadData.jobId;
    console.log(`✅ Upload success! Job ID: ${jobId}`);

    // 4. Poll for Status (Simulating frontend polling or SSE listening)
    console.log("⏳ Waiting for processing...");

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 sec

    const jobRes = await fetch(`${API_URL}/jobs/${jobId}`);
    const jobData = await jobRes.json();

    console.log(`📊 Job Status: ${jobData.job.status}`);
    console.log(`   Rows Processed: ${jobData.job.rowsProcessed}`);
    console.log(`   Rows Filtered: ${jobData.job.rowsFiltered}`);

    if (jobData.job.status === "completed") {
      // 5. Download Result
      console.log("📥 Downloading result...");
      const downloadRes = await fetch(`${API_URL}/download/${jobId}`);
      const text = await downloadRes.text();

      console.log("\n--- PROCESSED OUTPUT ---");
      console.log(text);
      console.log("------------------------");
    } else {
      console.log("⚠️ Job not completed yet, check console logs.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

runTest();
