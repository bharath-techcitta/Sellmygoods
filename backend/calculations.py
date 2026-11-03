def calculate_quote_line(
    quantity: float,
    unit_price: float,
    unit_discount: float = 0.0,
    tax_rate: float = 0.0,
    is_tax_inclusive: bool = False
) -> dict:
    """
    Financial calculation engine adhering to Section I1 of the SellMyGoods specification:
    gross = q * p
    discount = q * d
    discounted_line = q * (p - d)
    exclusive tax: tax = discounted_line * r
    exclusive net: net = discounted_line + tax
    inclusive base: base = discounted_line / (1 + r)
    inclusive tax: tax = discounted_line - base
    inclusive net: net = discounted_line
    """
    q = float(quantity)
    p = float(unit_price)
    d = min(max(float(unit_discount), 0.0), p) # 0 <= d <= p
    r = max(float(tax_rate), 0.0)

    gross = q * p
    discount = q * d
    discounted_line = q * (p - d)

    if is_tax_inclusive:
        base = discounted_line / (1.0 + r) if (1.0 + r) > 0 else discounted_line
        tax = discounted_line - base
        net = discounted_line
    else:
        base = discounted_line
        tax = discounted_line * r
        net = discounted_line + tax

    return {
        "quantity": round(q, 3),
        "unit_price": round(p, 2),
        "unit_discount": round(d, 2),
        "gross": round(gross, 2),
        "discount": round(discount, 2),
        "taxable_base": round(base, 2),
        "tax_rate": r,
        "tax": round(tax, 2),
        "net": round(net, 2),
        "is_tax_inclusive": is_tax_inclusive
    }

def calculate_budget_balance(
    approved_budget: float,
    adjustments: float,
    pr_reserved: float,
    po_committed: float,
    invoiced_actuals: float
) -> float:
    """
    Section I3: Available = approved budget + adjustments - open PR reservations - open PO commitments - recognized actuals.
    """
    avail = (approved_budget + adjustments) - (pr_reserved + po_committed + invoiced_actuals)
    return max(round(avail, 2), 0.0)

def calculate_composite_score(
    tech_score: float,
    commercial_score: float,
    tech_weight: float = 0.50,
    commercial_weight: float = 0.50
) -> float:
    """
    Section I2: Normalizes weighted technical and commercial scores to scale.
    e.g. 50/50 with 100 tech & 73 comm gives (100*0.5 + 73*0.5) = 86.5
    """
    total = (float(tech_score) * float(tech_weight)) + (float(commercial_score) * float(commercial_weight))
    return round(total, 2)
