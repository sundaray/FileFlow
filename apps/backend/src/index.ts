import app from "./app.js";
import { logger } from "./logger.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, function () {
  logger.info({ port: PORT }, "Server started");
});
