// Flow 3: explorbot as-is (npm package), used by the explorbot-run skill.
// Docs: https://testomat.ai/docs/explorbot
//
// - URL:       EXPLORBOT_URL (or EXPL_BOT_URL) from .env, else http://localhost:3000. A path on the command line
//              (`explorbot explore /products`) is relative to it.
// - Models:    OpenRouter, the recommendations bundled with this explorbot version. Needs OPENROUTER_API_KEY in .env.
//              Override a single role as 'openrouter/<model-id>' below.
// - Knowledge: shared with Flow 1 (expl-bot-*): .workflow-artifacts/expl-bot/sites/<host>/knowledge, one source of
//              human facts. Same frontmatter format (`url:` glob).
// - Experience/output: kept apart from Flow 1 in .workflow-artifacts/explorbot/ (explorbot writes runnable
//              CodeceptJS tests there, Flow 1 writes its own FLOW/ACTION notes).
// - Windows: use the non-TUI commands only (config, context, navigate, research, plan, explore, test, rerun).

const url = process.env.EXPLORBOT_URL || process.env.EXPL_BOT_URL || 'http://localhost:3000';

// Same rule as expl-bot-core/references/run-context.md and scripts/expl-bot-run.ts:
// hostname (+ non-default port), non-alphanumerics -> '-'.
function hostSlug(value) {
  try {
    const u = new URL(value);
    const raw = u.port ? `${u.hostname}:${u.port}` : u.hostname;
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  } catch {
    return 'default';
  }
}

const config = {
  web: {
    // use application host without path prefix (e.g., http://localhost:3000)
    url,
  },

  playwright: {
    // headed, like the rest of this repo; set EXPLORBOT headless via `--headless` on a single command
    show: true,
  },

  ai: {
    // every role (model, visionModel, agenticModel) takes the recommended openrouter models bundled with this version
    // override a single role as 'provider/model-id':
    // model: 'openrouter/<model-id>',
    recommendedModels: 'openrouter',
  },

  dirs: {
    knowledge: `.workflow-artifacts/expl-bot/sites/${hostSlug(url)}/knowledge`,
    experience: '.workflow-artifacts/explorbot/experience',
    output: '.workflow-artifacts/explorbot/output',
  },

  reporter: {
    // Save a local HTML report after each run.
    html: true,
    // Save a local markdown report after each run.
    markdown: true,
    // Group runs by title in Testomat.io / HTML reports. Defaults to today's date — customize or remove.
    runGroup: new Date().toISOString().slice(0, 10),
  },
};

export default config;
