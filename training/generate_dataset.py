"""Generate privacy-safe Russian financial-analysis examples for LoRA and evals."""
import json
import random
from pathlib import Path

random.seed(42)
CATEGORIES = ["Продукты", "Кафе и доставка", "Транспорт", "Дом и связь", "Здоровье", "Покупки и досуг"]
ADVICE = {
    "Продукты": "Планирование недельной корзины и сравнение цены за кг/л может снизить незапланированные покупки.",
    "Кафе и доставка": "Сокращение части доставок и кофе вне дома — проверяемая точка экономии.",
    "Транспорт": "Сравните сумму разовых поездок с подходящим проездным.",
    "Дом и связь": "Проверьте повторяющиеся тарифы и неиспользуемые подписки.",
    "Здоровье": "Не сокращайте необходимые медицинские расходы; сравнивайте только эквивалентные товары.",
    "Покупки и досуг": "Введите месячный лимит и период ожидания для незапланированных покупок.",
}

def example(index):
    values = {category: random.randrange(1500, 22000, 100) for category in CATEGORIES}
    total = sum(values.values())
    top = max(values, key=values.get)
    percent = round(values[top] / total * 100)
    saving = round(values[top] * 0.1 / 100) * 100
    input_data = {"period": {"from": "2026-04-01", "to": "2026-06-30"}, "total": total, "transactions": random.randint(45, 180), "categories": values, "topMerchants": []}
    output = {"insights": [
        {"title": f"{top} — крупнейшая категория", "text": f"На неё приходится {percent}% расходов. Снижение на 10% даст около {saving} ₽ экономии за период."},
        {"title": "Практический следующий шаг", "text": ADVICE[top]},
        {"title": "Граница точности", "text": "Без состава чеков нельзя корректно сравнивать конкретные товары и цены."},
    ]}
    return {"id": index, "messages": [
        {"role": "system", "content": "Финансовый анализатор: только проверяемые выводы из агрегатов, ответ JSON."},
        {"role": "user", "content": json.dumps(input_data, ensure_ascii=False)},
        {"role": "assistant", "content": json.dumps(output, ensure_ascii=False)},
    ]}

root = Path(__file__).parent
items = [example(i) for i in range(2500)]
for name, subset in (("train.jsonl", items[:2000]), ("validation.jsonl", items[2000:2250]), ("test.jsonl", items[2250:])):
    (root / name).write_text("\n".join(json.dumps(item, ensure_ascii=False) for item in subset) + "\n", encoding="utf-8")
print("Generated", len(items), "examples")

