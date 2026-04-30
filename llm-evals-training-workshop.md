---
marp: true
theme: default
paginate: true
size: 16:9
header: "VerifyWise — LLM Evaluations Training"
footer: "© VerifyWise — 1-Hour Session"
style: |
  section {
    background: #ffffff;
    color: #1C2130;
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 22px;
    padding: 50px 70px;
  }
  section.cover {
    background: linear-gradient(135deg, #13715B 0%, #0F5A47 100%);
    color: #ffffff;
    text-align: center;
  }
  section.cover h1 { font-size: 56px; margin-bottom: 10px; }
  section.cover h2 { font-size: 28px; font-weight: 400; opacity: 0.9; }
  section.section-divider {
    background: #13715B;
    color: #ffffff;
    text-align: center;
  }
  section.section-divider h1 { font-size: 60px; }
  section.section-divider h3 { font-weight: 400; opacity: 0.85; }
  section.quiz {
    background: #F5F8F7;
  }
  section.quiz h2::before { content: "❓ "; }
  section.answer {
    background: #EAF4F0;
  }
  section.answer h2::before { content: "✅ "; }
  section.objectives {
    background: #FAFBFC;
  }
  h1 { color: #13715B; font-size: 40px; margin-top: 0; }
  h2 { color: #13715B; font-size: 32px; }
  h3 { color: #1C2130; }
  strong { color: #13715B; }
  code { background: #F0F4F2; padding: 2px 6px; border-radius: 4px; font-size: 18px; }
  table { font-size: 18px; border-collapse: collapse; width: 100%; }
  th { background: #13715B; color: #ffffff; padding: 10px; }
  td { padding: 8px 10px; border-bottom: 1px solid #d0d5dd; }
  blockquote { border-left: 4px solid #13715B; padding-left: 16px; color: #475467; font-style: italic; }
  .small { font-size: 16px; color: #475467; }
---

<!-- _class: cover -->

# VerifyWise
## LLM Evaluations

**1-Hour Training Session**
For Compliance & AI Governance Professionals

**Efe Acar**

<!--
Speaker notes: Welcome attendees. Today's session runs 1 hour: 20 minutes of slides (theory + VerifyWise demo), then a hands-on lab and Q&A. Confirm everyone has access to VerifyWise. Ask: how many have run an eval before?
-->

---

# Session overview

- **Duration:** 60 minutes total
- **Presentation:** 20 minutes (this deck)
- **Hands-on lab:** 30 minutes (live in VerifyWise)
- **Q&A:** 10 minutes

**What you'll leave with:**
- A clear mental model of LLM evaluations
- Understanding of every VerifyWise eval screen
- A completed experiment you ran yourself

<!--
Speaker notes: Keep the pace brisk — the deck is intentionally lean. All deeper discussion moves to the lab or Q&A. Ask attendees to hold questions until after each section.
-->

---

<!-- _class: section-divider -->

# Part 1
### LLM Evaluation — Theory & Concepts

---

<!-- _class: objectives -->

# Learning objectives — Part 1

By the end of this section you will be able to:

- **Explain** why probabilistic model outputs require structured evaluation
- **Connect** LLM evaluations to EU AI Act, ISO 42001, and NIST AI RMF requirements
- **Contrast** LLM-as-judge scoring against formula-based metrics (BLEU, ROUGE, fairlearn)
- **Select** the right metric for a given task type (Q&A, summarisation, code generation)
- **Describe** the five-step eval pipeline used in production systems

<!--
Speaker notes: Emphasise "probabilistic" — models don't give the same answer twice. This is what makes gut-feel insufficient and why we need a systematic process. Probe the room: "How do you currently know if your LLM is giving good answers?"
-->

---

# Why LLMs need structured evaluation

LLMs are probabilistic — the same prompt can return different outputs on each call.

| Risk if you skip evals | Example |
|------------------------|---------|
| Silent regressions | A prompt tweak fixes one case, breaks 20 others |
| Model selection bias | Chose GPT-4o over Gemini based on one demo, not data |
| Compliance gaps | EU AI Act Art. 9 requires documented performance evidence |
| Production drift | Model behaviour shifts as provider updates base weights |

> Without evals, you are shipping guesses, not governed AI.

<!--
Speaker notes: The compliance row lands well with this audience. Article 9 of the EU AI Act requires high-risk AI systems to have a quality management system including performance monitoring — evals are that system. Ask: "Who here has had a model update break something in production?"
-->

---

# Evals are the engine of AI governance

Governance frameworks don't just recommend evals — they require documented evidence of them.

| Framework | What it requires | How evals satisfy it |
|-----------|-----------------|----------------------|
| EU AI Act — Art. 9 | Quality management system with testing & monitoring | Stored eval results are the documented testing record |
| EU AI Act — Art. 72 | Post-market monitoring of high-risk AI | Scheduled evals detect model drift after deployment |
| ISO 42001 — Cl. 9.1 | Performance evaluation of the AI management system | Eval metrics feed the periodic management review |
| NIST AI RMF — MEASURE | Quantify and monitor AI risks | Evals operationalise the MEASURE function |

> An eval result in VerifyWise is not just an engineering metric — it is a compliance evidence artefact.

<!--
Speaker notes: This is the key bridge slide for this audience. Ask: "Which of these frameworks applies to your organisation?" Most will say EU AI Act. Emphasise: Article 9 says you must have a quality management system — evals are the measurable component of that system. Without stored, auditable eval results, your QMS is a policy document with no supporting evidence. VerifyWise stores every experiment result with timestamps, org isolation, and links to use cases.
-->

---

# How large language models work

LLMs are **next-token predictors**: given a sequence of tokens, the model outputs a probability distribution over the next token and samples from it.

| Layer | What happens |
|-------|-------------|
| Tokenisation | Text → integer tokens (words, sub-words, characters) |
| Embedding | Tokens → high-dimensional vectors |
| Transformer blocks | Self-attention builds context across all prior tokens |
| Output head | Softmax over vocabulary → probability distribution |
| Sampling | Token drawn from distribution (temperature, top-p control randomness) |

> Models don't "know" facts — they predict what text statistically follows a given context. This is the root cause of hallucination.

<!--
Speaker notes: Draw the forward-pass on a whiteboard if possible — input tokens → embedding → N transformer layers → logits → softmax → sample. The key point: there is no lookup table of facts, no database check. The model's "knowledge" is entirely in its weights, compressed from the training corpus. This explains why the same model can be confidently wrong and why temperature > 0 produces different answers each run.
-->

---

# Why models hallucinate and make errors

Hallucination is not a bug — it is a structural property of next-token prediction without a ground-truth retrieval step.

| Root cause | What it looks like in practice |
|------------|-------------------------------|
| No grounding | Generates plausible-sounding citations, names, dates that don't exist |
| Distributional gap | Training data underrepresents a topic → model interpolates wrongly |
| Confidence miscalibration | High-probability token ≠ factually correct token |
| Context window limits | Long documents exceed the window; earlier facts are "forgotten" |
| Instruction–knowledge tension | Asked to answer even when it shouldn't — RLHF rewards helpfulness |

> Mitigation strategies: retrieval-augmented generation (RAG), grounding checks, structured output constraints, and — critically — evals that catch these failures before users do.

<!--
Speaker notes: The "confidence miscalibration" row is the hardest to explain. Contrast with a search engine: Google returns "no results" when unsure. GPT-4o returns a confident sentence regardless. The model was trained to always complete the text — silence was penalised during RLHF. Point to TruthfulQA as the standard benchmark for measuring hallucination rate. VerifyWise tracks hallucination as a first-class metric in every experiment.
-->

---

# Bias and fairness in LLMs

Bias enters at every stage of the model lifecycle — not just training data.

| Stage | Bias mechanism | Example |
|-------|---------------|---------|
| Pre-training data | Web text reflects historical inequities | "nurse" → female, "engineer" → male |
| RLHF / fine-tuning | Human raters have cultural blind spots | Western communication styles rated higher |
| Prompt design | Framing effects shift output distributions | "Write about a doctor" → male by default |
| Deployment context | Unequal error rates across groups | Lower accuracy for non-native English speakers |

> Bias in a model's outputs can constitute discrimination under EU AI Act Annex III (employment, credit, education). This is why bias audits are a compliance requirement, not just an ethical preference.

<!--
Speaker notes: Ask the room: "Where do you think bias is hardest to detect?" The deployment context row is the right answer — you don't see it until you slice your eval results by demographic. VerifyWise supports bias audits via the Bias Audit module (csv upload + protected attribute config). Mention that the EU AI Act specifically lists employment decisions, credit scoring, and education as high-risk use cases where bias must be documented and mitigated.
-->

---

# A taxonomy of LLM evaluations

| Axis | Option A | Option B |
|------|----------|----------|
| Who scores? | **Automated** — fast, cheap, scalable | **Human** — gold standard, slow |
| What is scored? | **Functional** — did the task complete? | **Quality** — how well? |
| Scope | **Unit** — single prompt / component | **End-to-end** — full pipeline |
| Dataset | **Benchmark** — standard public sets | **Slice** — production data subsets |

**In practice:** automate 90%, human-review 10% of edge cases and calibrate.

<!--
Speaker notes: Walk the table row by row. The "unit vs end-to-end" row trips people up — unit evals catch prompt bugs, E2E evals catch integration bugs. You need both. Benchmark scores (MMLU, TruthfulQA) tell you about the model; production slices tell you about *your* system.
-->

---

# Key evaluation dimensions

| Dimension | What you measure | Example metric |
|-----------|-----------------|----------------|
| Correctness | Is the answer factually right? | Exact match, F1, BERTScore |
| Hallucination | Does the model fabricate facts? | FActScore, citation hit rate |
| Completeness | Does it address the full question? | Coverage score (LLM-as-judge) |
| Answer relevancy | Is the response on-topic? | Cosine similarity to question |
| Safety / harm | Does it produce unsafe content? | Refusal rate, toxicity classifier |
| Instruction following | Does it comply with the prompt? | IFEval pass rate |

> Start with the 2–3 dimensions most critical to your use case, not all six at once.

<!--
Speaker notes: VerifyWise supports correctness, completeness, hallucination, and answerRelevancy out of the box (plus custom scorers). Point out that the "right" set depends on the task — a summarisation system cares more about completeness; a medical Q&A system cares more about hallucination.
-->

---

# Evaluation methods

**Reference-based** — compare output against a known-correct answer
`Exact match · ROUGE · BLEU · BERTScore`
Best for: Q&A with ground truth, translation, structured extraction

**LLM-as-judge** — use a stronger model to score on a rubric
`GPT-4o as judge · Structured 1–5 rubric · Chain-of-thought reasoning`
Best for: open-ended generation, helpfulness, tone — where no single correct answer exists

**Execution-based** — run the generated code or SQL and verify correctness
`HumanEval pass@k · SQL query result match`
Best for: coding assistants, data pipelines, tool-calling agents

<!--
Speaker notes: VerifyWise uses LLM-as-judge for all quality metrics. The judge model is configurable — default is GPT-4o. Mention the known biases: position bias (judge prefers the first answer), verbosity bias (longer answers score higher). VerifyWise mitigates by forcing structured rubrics and separate reasoning steps.
-->

---

# LLM-as-judge — formulas vs language models

Traditional metrics use **formulas** on text tokens. LLM-as-judge uses a **language model** to reason about quality the way a human reviewer would.

| Approach | How the score is computed | Example |
|----------|--------------------------|---------|
| Formula-based | Mathematical comparison of tokens | BLEU counts n-gram overlaps; ROUGE counts reference word recall |
| Statistical (fairlearn) | Disparity ratios across demographic groups | Demographic parity = P(ŷ=1\|A=0) vs P(ŷ=1\|A=1) |
| LLM-as-judge | Judge reads question + answer + rubric → score + reasoning | "Rate 1–5: does the answer fully address the question without false information?" |

> BLEU scores "A cat was sitting on a mat" low vs "The cat sat on the mat" — purely lexical. A judge model reads both, understands they mean the same thing, and scores them equally.

<!--
Speaker notes: The BLEU example is the most concrete demonstration of why formulas fail for open-ended tasks. Draw this on a whiteboard if possible. Then transition: "So what does the judge actually do instead?"
-->

---

# LLM-as-judge — what the judge actually does

The judge is just another LLM call. For each row in your dataset it receives a structured prompt and returns a structured score.

**Judge input (sent automatically by VerifyWise):**
- The original question from the dataset
- The model's response
- The expected output (if provided)
- The scoring rubric for the metric (e.g. correctness, hallucination)

**Judge output:**
`{"score": 0.8, "reason": "Answer is accurate but omits the deadline requirement."}`

**Why this beats formulas for quality metrics:**
Formulas cannot tell you whether an answer is *helpful*, *complete*, or *hallucinated* without an exact reference string. The judge reads the answer semantically — it can spot fabricated facts even when the wording sounds confident and fluent.

> Known biases to watch: verbosity bias (longer answers score higher), position bias (judge favours the first option in pairwise). VerifyWise mitigates with structured JSON output and chain-of-thought before the score.

<!--
Speaker notes: Show the actual judge prompt if possible — it's in VerifyWise under Scorers. The chain-of-thought step is key: forcing the judge to reason before scoring significantly reduces verbosity and position bias. Mention cost: each judge call is one LLM API call. For a 50-row dataset with 4 metrics, that's 200 judge calls — VerifyWise tracks this spend via the AI Gateway.
-->

---

# The eval pipeline — 5 steps

1. **Define tasks** — what should the model do in specific, testable terms?
2. **Collect dataset** — seed examples + production logs + synthetic pairs
3. **Choose metrics** — 2–3 per task; align with business impact, not academic prestige
4. **Run evaluator** — automated scoring, then sample human review of failures
5. **Track & gate** — CI threshold gates block regressions before deployment

> The pipeline only works if it runs on every change. Treat evals like unit tests.

<!--
Speaker notes: The "5" makes it memorable. Step 1 is where most teams fail — vague tasks ("be helpful") produce meaningless scores. Emphasise step 5: if evals don't gate deployment, they're documentation, not quality control. VerifyWise covers steps 3–5 entirely.
-->

---

<!-- _class: section-divider -->

# Part 2
### LLM Evals in VerifyWise

---

<!-- _class: objectives -->

# Learning objectives — Part 2

By the end of this section you will be able to:

- **Add** a model configuration in VerifyWise (provider, model name, API key)
- **Upload** a dataset of question-answer pairs for evaluation
- **Configure** a judge model and select evaluation metrics
- **Run** an experiment and read the per-metric results
- **Interpret** pass/fail thresholds and understand what the scores mean

<!--
Speaker notes: This section is a live walkthrough — attendees follow along on their own screens. Each slide maps to one step in the VerifyWise UI. The hands-on lab immediately after repeats the same steps so attendees cement the workflow.
-->

---

# Demo — Step 1: Add a model

*[SCREENSHOT: Models page → Add model form with provider, model name, API key fields]*

**What you're doing:** Registering the LLM you want to evaluate against your dataset.

- Navigate to **LLM Evals → Models**
- Click **Add model**
- Select provider (OpenAI, Anthropic, etc.) and enter the model name
- Add your API key — stored encrypted, never logged

> The model you add here is the *system under test* — the one your application actually calls. The judge model is configured separately in the experiment.

<!--
Speaker notes: Point out the provider dropdown — VerifyWise supports OpenAI, Anthropic, Google, Mistral, and any OpenAI-compatible endpoint via the AI Gateway. The API key is stored encrypted in the database and only used at experiment runtime. Attendees who don't have their own API key can use the shared demo key pre-loaded in the workshop instance.
-->

---

# Demo — Step 2: Add a dataset

*[SCREENSHOT: Datasets page → Upload dataset dialog showing file format]*

**What you're doing:** Providing the questions (and optionally expected answers) the model will be tested on.

- Navigate to **LLM Evals → Datasets**
- Click **Upload dataset**
- Upload a JSON file — each row needs at minimum an `input` field

**Minimum dataset format:**
```json
[
  { "input": "What is the capital of France?", "expected_output": "Paris" },
  { "input": "Summarise the GDPR in one sentence.", "expected_output": "..." }
]
```

> Built-in datasets are also available for common tasks (chatbot Q&A, summarisation, RAG). Use these to get started quickly.

<!--
Speaker notes: The `expected_output` field is optional — if provided, it enables reference-based scoring (exact match, ROUGE) in addition to LLM-as-judge scoring. For open-ended tasks where no single correct answer exists, omit it and rely entirely on the judge. Recommended minimum: 20 rows for a demo, 100+ for a production eval.
-->

---

# Demo — Step 3: Configure the judge

*[SCREENSHOT: New experiment form showing judge model selector and metric checkboxes]*

**What you're doing:** Telling VerifyWise how to score each model response.

- Navigate to **LLM Evals → Experiments → New experiment**
- Select the **model** (Step 1) and **dataset** (Step 2)
- Choose the **judge model** — the LLM that scores responses (default: GPT-4o)
- Select **metrics:** `correctness`, `completeness`, `hallucination`, `answerRelevancy`
- Set the **pass threshold** (default 0.7 = 70%)

> The judge reads each `{question, model_answer, expected_answer}` triple and scores each metric independently using a structured rubric — not a formula.

<!--
Speaker notes: Emphasise the judge model selection — you can use a different (stronger) model as judge than the one being evaluated. Common pattern: evaluate GPT-4o-mini but use GPT-4o as judge. The threshold is per-metric: if any metric's average falls below 70%, the experiment is marked FAILED. Custom scorers can also be added here — these are your own rubric prompts for domain-specific criteria.
-->

---

# Demo — Step 4: Run the evaluation

*[SCREENSHOT: Experiment detail page showing running status / progress bar]*

**What you're doing:** VerifyWise sends each dataset row to the model, collects responses, then sends each response to the judge for scoring.

**What happens under the hood:**

1. For each row in the dataset, the model generates a response
2. The judge model receives: `question + model_response + expected_output (if present)`
3. The judge scores each metric on a 0–1 scale with a chain-of-thought explanation
4. Scores are aggregated per metric across all rows
5. Each metric is compared to the threshold → pass or fail

> Experiments are async — you can close the browser and come back. Results are stored permanently.

<!--
Speaker notes: Walk through the progress indicator in the UI. For a 20-row dataset with 4 metrics, that's 20 model calls + 80 judge calls = 100 LLM API calls total. This is why cost tracking via the AI Gateway matters — VerifyWise logs every call and its token usage. Typical runtime for a 20-row experiment: 2–4 minutes depending on model and judge latency.
-->

---

# Demo — Step 5: Reading the results

*[SCREENSHOT: Experiment results page showing per-metric scores and overall pass/fail]*

**What each number means:**

| Result element | What it tells you |
|----------------|-------------------|
| Overall: PASS / FAIL | Did every metric meet the threshold? |
| Per-metric score (e.g. correctness: 0.84) | Average judge score for that dimension across all rows |
| Per-row breakdown | Which specific questions the model struggled with |
| Judge reasoning | Why the judge gave that score — the chain-of-thought explanation |

> A score of 0.84 on correctness means: across your dataset, the judge rated the model's answers as 84% correct on average. Drill into the per-row view to see exactly which questions failed and why.

<!--
Speaker notes: The per-row breakdown is the most valuable part for improvement — it tells you whether failures cluster around a topic, a question type, or a specific phrasing. That clustering is your next prompt engineering or fine-tuning target. The judge reasoning column shows the actual text the judge produced before giving its score — this is auditable evidence of how the score was determined.
-->

---

# Model arena — side-by-side comparison

Arena runs the same dataset against **multiple model configurations simultaneously** and uses a judge model to produce a head-to-head ranking.

```python
results = client.arena.compare_and_wait(
    contestants=[
        {"name": "GPT-4o-mini",  "hyperparameters": {"provider": "openai",     "model": "gpt-4o-mini"}},
        {"name": "Claude Haiku", "hyperparameters": {"provider": "anthropic", "model": "claude-3-5-haiku-20241022"}},
    ],
    dataset_id="2",
    judge_model="gpt-4o",
    timeout_minutes=15,
)
```

Use arena when: selecting a model for a new feature · validating a fine-tuned model against its base · benchmarking after a provider update.

<!--
Speaker notes: Arena is the answer to "which model should we use?" It removes the gut-feel guessing and gives a reproducible, auditable answer. The judge model scores each contestant's answer on the same rubric — results are stored and can be attached to a compliance evidence file.
-->

---

# CI/CD integration — Python SDK

Gate deployments automatically: if evals fail, the pipeline exits non-zero and the deploy is blocked.

```python
import sys
from verifywise import VerifyWiseClient

client = VerifyWiseClient(api_url=os.environ["VW_API_URL"], token=os.environ["VW_API_TOKEN"])

results = client.experiments.run_and_wait(
    project_id=os.environ["VW_PROJECT_ID"],
    name=f"CI — {os.environ.get('GITHUB_SHA', 'local')[:8]}",
    model_name="gpt-4o-mini",
    model_provider="openai",
    dataset_id=os.environ["VW_DATASET_ID"],
    metrics=["correctness", "completeness", "hallucination"],
    threshold=0.7,
)

if not results.passed:
    sys.exit(1)   # Block the deployment
```

<!--
Speaker notes: This is the "eval pipeline step 5" from Part 1 made concrete. Point out the three environment variables — these go in GitHub Actions secrets or your CI system's secret store. The `run_and_wait` method polls until the experiment completes, then returns a structured result object. Every run is stored in VerifyWise for audit.
-->

---

---

# Key takeaways

| Concept | One-line summary |
|---------|-----------------|
| Why evals | Without measurement, AI governance is documentation theatre |
| Taxonomy | Automate 90%, human-review 10%; unit + E2E; benchmarks + slices |
| Metrics | Start with correctness, completeness, hallucination, answerRelevancy |
| VerifyWise | EvalServer runs experiments, Arena picks models, SDK gates CI |
| Compliance | Every experiment result is stored, org-isolated, and audit-ready |

> Define → Measure → Improve. Repeat on every model or prompt change.

<!--
Speaker notes: Read through the table quickly. The compliance row is the bridge back to the governance platform — eval results aren't just engineering metrics; they're evidence artefacts that satisfy Article 9 and ISO 42001 clause 9.1.
-->

---

# What's next

**This week**
- Complete today's lab (create one project, upload a dataset, run an experiment)
- Attach the experiment result to a use case in the VerifyWise platform

**This month**
- Add eval CI to one active AI feature in your environment
- Run an Arena comparison for any model decision pending a review

**This quarter**
- Instrument all production-facing LLM features with automated evals
- Schedule a quarterly threshold review as part of your governance cadence

<!--
Speaker notes: The "this week" task is concrete and completable today — don't let attendees leave without at least starting it. The quarterly review ties evals to the governance lifecycle, not just a one-off engineering activity.
-->

---

<!-- _class: cover -->

# Thank you

**Questions?**

`app.verifywise.ai`
`verifywise.ai/user-docs`

**Efe Acar**

<!--
Speaker notes: Leave 10 minutes for Q&A. Common questions: "What if I don't have ground-truth labels?" (Use LLM-as-judge with a rubric), "Can I use my own judge model?" (Yes — configure AI Gateway to point to any provider), "How many examples do I need?" (Aim for 100+ per task slice for statistical reliability; 50 is the practical minimum).
-->
