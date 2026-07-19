import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const button = document.getElementById("runAI");
const badge = document.getElementById("aiBadge");
const status = document.getElementById("aiStatus");
const progress = document.getElementById("aiProgress");
const bar = progress.querySelector("i");
let engine;

function state(label, message, kind = "") {
  badge.textContent = label;
  badge.className = kind;
  status.textContent = message;
}

function parse(text) {
  try {
    const data = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    if (Array.isArray(data.insights) && data.insights.length) return data.insights.slice(0, 4);
  } catch (_) {}
  return [{ title: "Локальный анализ", text: text.slice(0, 900) }];
}

async function run() {
  const snapshot = window.getFinSightSnapshot?.();
  if (!snapshot?.transactions) {
    state("Нет данных", "Сначала запустите демо или загрузите выписку.", "error");
    return;
  }
  if (!navigator.gpu) {
    state("WebGPU недоступен", "Точные выводы по правилам остаются активны. Используйте актуальный Chrome или Edge для локальной модели.", "error");
    return;
  }
  button.disabled = true;
  progress.classList.remove("hidden");
  try {
    if (!engine) {
      state("Загрузка", "Модель скачивается один раз и сохраняется в кэше браузера.");
      engine = await CreateMLCEngine(MODEL, { initProgressCallback: p => {
        const value = Math.max(0, Math.min(100, Math.round((p.progress || 0) * 100)));
        bar.style.width = `${value}%`;
        status.textContent = `Подготовка локальной модели: ${value}%`;
      }});
    }
    state("Анализ", "Модель формирует выводы локально на вашем устройстве.");
    bar.style.width = "100%";
    const response = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "Ты осторожный финансовый аналитик. Анализируй только переданную агрегированную статистику. Не выдумывай цены, адреса, товары или факты. Не давай инвестиционных рекомендаций. Верни только JSON вида {\"insights\":[{\"title\":\"короткий заголовок\",\"text\":\"конкретный вывод с числами и осторожной рекомендацией\"}]}. Нужно 3-4 вывода на русском языке." },
        { role: "user", content: JSON.stringify(snapshot) }
      ],
      temperature: 0.2,
      max_tokens: 650,
      response_format: { type: "json_object" }
    });
    window.renderAIInsights(parse(response.choices[0].message.content));
    state("Работает локально", "AI‑выводы созданы без отправки банковских данных.", "ready");
    button.textContent = "Обновить AI‑анализ";
  } catch (error) {
    console.error(error);
    state("Не удалось запустить", "Точные расчёты продолжают работать. Проверьте WebGPU и свободную память устройства.", "error");
  } finally {
    button.disabled = false;
    setTimeout(() => progress.classList.add("hidden"), 800);
  }
}

button.addEventListener("click", run);

