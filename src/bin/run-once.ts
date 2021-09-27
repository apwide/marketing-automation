import runEngine from "../lib/engine/engine.js";
import { getCliOptions } from "../lib/cli/index.js";

const { downloader, uploader } = getCliOptions();

await runEngine({
  downloader,
  uploader,
});
