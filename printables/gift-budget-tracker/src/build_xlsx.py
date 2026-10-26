#!/usr/bin/env python3
"""Christmas Gift & Budget Tracker (Quiet Table Co.): builds the .xlsx with openpyxl.

    python3 build_xlsx.py <out_dir>

Writes <out_dir>/Christmas-Gift-Budget-Tracker.xlsx (blank, the buyer file) and
<out_dir>/Christmas-Gift-Budget-Tracker-Example.xlsx (same workbook filled with sample data).
Only functions that Excel and Google Sheets both support (SUM, SUMIFS, COUNTIF(S), COUNTA, IF,
AND, OR, MIN, MAX, ROUND, ROUNDUP, REPT, DATE, YEAR, TODAY, N); no tables, macros or data bars.
"""
import sys
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

PINE, BERRY, GOLD, INK, SOFT = "2F5D50", "B23A3A", "D9A441", "3B2F2A", "6E5F57"
FROST, CREAM, LINE, WHITE = "EAF1EE", "FDF3DC", "D7E2DC", "FFFFFF"
SERIF, SANS = "Georgia", "Arial"
MONEY = '"$"#,##0.00'
PCT = "0%"
DATEF = "mmm d, yyyy"

thin = Side(style="thin", color=LINE)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
fill = lambda c: PatternFill("solid", start_color=c, end_color=c)

# Sheet sizes (rows are 1-based; data starts at row 5 under the header on row 4)
P0, P1 = 6, 55          # People rows (50 people); totals on row 57
G0, G1 = 5, 304         # Gift Tracker rows (300 gifts)
E0, E1 = 5, 404         # Expense Log rows (400 expenses)
S0, S1 = 10, 61         # Savings weeks (52)
B_GIFT, B0, B1, B_UNCAT, B_TOT = 5, 6, 17, 18, 20   # Budget rows
CATS = ["Food & treats", "Decorations", "Wrapping & tags", "Cards & postage", "Parties & hosting",
        "Travel", "Outfits", "Charity & giving", "Kids' activities", "Other"]

GT, EL, PE, BU, SA = "'Gift Tracker'", "'Expense Log'", "People", "Budget", "Savings"
rng = lambda sheet, col, a, b: f"{sheet}!${col}${a}:${col}${b}"
BAR = lambda x: f'REPT("█",ROUND(MIN(1,MAX(0,{x}))*20,0))&REPT("░",20-ROUND(MIN(1,MAX(0,{x}))*20,0))'


def style(c, *, font=None, fill_=None, fmt=None, align=None, border=True):
    c.font = font or Font(name=SANS, size=10, color=INK)
    if fill_:
        c.fill = fill(fill_)
    if fmt:
        c.number_format = fmt
    c.alignment = align or Alignment(vertical="center")
    if border:
        c.border = BOX


def title(ws, text, sub, width_cols):
    ws.sheet_view.showGridLines = False
    last = chr(64 + width_cols)
    ws.merge_cells(f"A1:{last}1")
    ws.merge_cells(f"A2:{last}2")
    ws["A1"] = text
    ws["A1"].font = Font(name=SERIF, size=20, bold=True, color=WHITE)
    ws["A2"] = sub
    ws["A2"].font = Font(name=SANS, size=10, italic=True, color=WHITE)
    for r in (1, 2):
        for col in range(1, width_cols + 1):
            ws.cell(r, col).fill = fill(PINE)
        ws.cell(r, 1).alignment = Alignment(vertical="center", indent=1)
    ws.row_dimensions[1].height = 38
    ws.row_dimensions[2].height = 22
    ws.row_dimensions[3].height = 8


def header(ws, row, names, widths):
    for i, (n, w) in enumerate(zip(names, widths), start=1):
        c = ws.cell(row, i, n)
        style(c, font=Font(name=SANS, size=10, bold=True, color=WHITE), fill_=BERRY,
              align=Alignment(horizontal="center", vertical="center", wrap_text=True))
        ws.column_dimensions[chr(64 + i)].width = w
    ws.row_dimensions[row].height = 30


def inp(c, fmt=None, align=None):
    style(c, fill_=CREAM, fmt=fmt, align=align)


def calc(c, f, fmt=None, bold=False, color=INK, align=None):
    c.value = f
    style(c, font=Font(name=SANS, size=10, bold=bold, color=color), fill_=WHITE, fmt=fmt, align=align)


def bar(c, f):
    c.value = f
    style(c, font=Font(name=SANS, size=9, color=PINE), fill_=WHITE)


def yes_no(ws, ref):
    dv = DataValidation(type="list", formula1='"Yes,No"', allow_blank=True, showErrorMessage=False)
    ws.add_data_validation(dv)
    dv.add(ref)


def list_dv(ws, ref, src, prompt):
    dv = DataValidation(type="list", formula1=src, allow_blank=True, showErrorMessage=True, errorStyle="warning",
                        errorTitle="Not on the list", error=prompt)
    ws.add_data_validation(dv)
    dv.add(ref)


def neg_red(ws, ref, first):
    ws.conditional_formatting.add(ref, FormulaRule(formula=[f'AND(ISNUMBER({first}),{first}<0)'],
                                                   font=Font(color=BERRY, bold=True)))


def print_setup(ws, landscape=True):
    ws.page_setup.orientation = "landscape" if landscape else "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_options.horizontalCentered = True
    ws.page_margins.left = ws.page_margins.right = 0.4


def build(sample: bool):
    wb = Workbook()
    start = wb.active
    start.title = "Start Here"
    dash = wb.create_sheet("Dashboard")
    bud = wb.create_sheet("Budget")
    ppl = wb.create_sheet("People")
    gt = wb.create_sheet("Gift Tracker")
    el = wb.create_sheet("Expense Log")
    sav = wb.create_sheet("Savings")
    for ws, col in ((start, GOLD), (dash, PINE), (bud, BERRY), (ppl, BERRY), (gt, PINE), (el, BERRY), (sav, GOLD)):
        ws.sheet_properties.tabColor = col

    # ---------------- People ----------------
    ws = ppl
    title(ws, "Gift Budget by Person", "One row per person. Type a name, group and budget; the rest fills in from the Gift Tracker.", 11)
    header(ws, 5, ["Name", "Group", "Budget", "Planned\n(all gifts)", "Spent\n(bought)", "Left", "Gifts",
                   "Bought", "Wrapped", "Given", "Status"], [22, 13, 12, 12, 12, 12, 8, 8, 9, 8, 18])
    ws.row_dimensions[4].height = 6
    for r in range(P0, P1 + 1):
        inp(ws.cell(r, 1)); inp(ws.cell(r, 2)); inp(ws.cell(r, 3), MONEY)
        a = f"$A{r}"
        calc(ws.cell(r, 4), f'=IF({a}="","",SUMIFS({rng(GT,"D",G0,G1)},{rng(GT,"A",G0,G1)},{a}))', MONEY)
        calc(ws.cell(r, 5), f'=IF({a}="","",SUMIFS({rng(GT,"D",G0,G1)},{rng(GT,"A",G0,G1)},{a},{rng(GT,"E",G0,G1)},"Yes"))', MONEY)
        calc(ws.cell(r, 6), f'=IF(OR({a}="",C{r}=""),"",C{r}-E{r})', MONEY)
        ctr = Alignment(horizontal="center", vertical="center")
        calc(ws.cell(r, 7), f'=IF({a}="","",COUNTIF({rng(GT,"A",G0,G1)},{a}))', align=ctr)
        for col, L in ((8, "E"), (9, "F"), (10, "G")):
            calc(ws.cell(r, col), f'=IF({a}="","",COUNTIFS({rng(GT,"A",G0,G1)},{a},{rng(GT,L,G0,G1)},"Yes"))', align=ctr)
        calc(ws.cell(r, 11), f'=IF({a}="","",IF(G{r}=0,"No gift yet",IF(AND(C{r}<>"",E{r}>C{r}),"Over budget",'
                              f'IF(AND(C{r}<>"",D{r}>C{r},J{r}<G{r}),"Plan over budget",'
                              f'IF(J{r}=G{r},"All given ✓",IF(H{r}<G{r},"Shopping",IF(I{r}<G{r},"To wrap","Ready to give")))))))')
    T = P1 + 2
    ws.cell(T, 1, "TOTAL")
    style(ws.cell(T, 1), font=Font(name=SANS, size=10, bold=True, color=WHITE), fill_=PINE)
    style(ws.cell(T, 2), fill_=PINE)
    ws.cell(T, 2).value = f'=COUNTA(A{P0}:A{P1})&" people"'
    ws.cell(T, 2).font = Font(name=SANS, size=10, bold=True, color=WHITE)
    for col in range(3, 11):
        L = chr(64 + col)
        c = ws.cell(T, col, f"=SUM({L}{P0}:{L}{P1})")
        style(c, font=Font(name=SANS, size=10, bold=True, color=WHITE), fill_=PINE,
              fmt=MONEY if col <= 6 else "0", align=Alignment(horizontal="right" if col <= 6 else "center", vertical="center"))
    style(ws.cell(T, 11), fill_=PINE)
    neg_red(ws, f"F{P0}:F{T}", f"F{P0}")
    ws.conditional_formatting.add(f"K{P0}:K{P1}", FormulaRule(formula=[f'ISNUMBER(SEARCH("over budget",K{P0}))'], font=Font(color=BERRY, bold=True)))
    ws.conditional_formatting.add(f"K{P0}:K{P1}", FormulaRule(formula=[f'K{P0}="All given ✓"'], font=Font(color=PINE, bold=True)))
    dv = DataValidation(type="list", formula1='"Family,Friends,Kids,Work,School,Neighbors,Other"', allow_blank=True, showErrorMessage=False)
    ws.add_data_validation(dv); dv.add(f"B{P0}:B{P1}")
    ws.freeze_panes = f"B{P0}"
    print_setup(ws)

    # ---------------- Gift Tracker ----------------
    ws = gt
    title(ws, "Gift Tracker", "One row per gift. Pick the person, add the price, then mark Bought, Wrapped and Given.", 8)
    header(ws, 4, ["Person", "Gift", "Store / link", "Price", "Bought?", "Wrapped?", "Given?", "Notes / order #"],
           [20, 30, 22, 12, 10, 10, 10, 26])
    ctr = Alignment(horizontal="center", vertical="center")
    for r in range(G0, G1 + 1):
        inp(ws.cell(r, 1)); inp(ws.cell(r, 2)); inp(ws.cell(r, 3)); inp(ws.cell(r, 4), MONEY)
        for col in (5, 6, 7):
            inp(ws.cell(r, col), align=ctr)
        inp(ws.cell(r, 8))
    list_dv(ws, f"A{G0}:A{G1}", f"={rng(PE,'A',P0,P1)}", "This name is not on the People tab yet. Add it there so their totals add up.")
    yes_no(ws, f"E{G0}:G{G1}")
    green = PatternFill("solid", start_color="D9EAD3", end_color="D9EAD3")
    ws.conditional_formatting.add(f"E{G0}:G{G1}", FormulaRule(formula=[f'E{G0}="Yes"'], fill=green, font=Font(color=PINE, bold=True)))
    ws.conditional_formatting.add(f"A{G0}:D{G1}", FormulaRule(formula=[f'$G{G0}="Yes"'], font=Font(color="8C9A93")))
    ws.freeze_panes = f"B{G0}"
    print_setup(ws)

    # ---------------- Budget ----------------
    ws = bud
    title(ws, "Holiday Budget by Category", "Type a budget per category. Spent fills in from the Gift Tracker (gifts) and the Expense Log (everything else).", 6)
    header(ws, 4, ["Category", "Budget", "Spent", "Left", "% used", "Progress"], [26, 14, 14, 14, 10, 26])
    ws.cell(B_GIFT, 1, "Gifts (from Gift Tracker)")
    style(ws.cell(B_GIFT, 1), font=Font(name=SANS, size=10, bold=True, color=INK), fill_=FROST)
    inp(ws.cell(B_GIFT, 2), MONEY)
    ws.cell(B_GIFT, 2).value = f"={PE}!C{T}"
    calc(ws.cell(B_GIFT, 3), f'=SUMIFS({rng(GT,"D",G0,G1)},{rng(GT,"E",G0,G1)},"Yes")', MONEY)
    for i, r in enumerate(range(B0, B1 + 1)):
        inp(ws.cell(r, 1)); inp(ws.cell(r, 2), MONEY)
        if i < len(CATS):
            ws.cell(r, 1, CATS[i])
        calc(ws.cell(r, 3), f'=IF(A{r}="","",SUMIFS({rng(EL,"D",E0,E1)},{rng(EL,"C",E0,E1)},A{r}))', MONEY)
    ws.cell(B_UNCAT, 1, "Not in a category")
    style(ws.cell(B_UNCAT, 1), font=Font(name=SANS, size=10, italic=True, color=SOFT), fill_=WHITE)
    style(ws.cell(B_UNCAT, 2), fill_=WHITE)
    calc(ws.cell(B_UNCAT, 3), f"=SUM({rng(EL,'D',E0,E1)})-SUM(C{B0}:C{B1})", MONEY, color=SOFT)
    for r in list(range(B_GIFT, B1 + 1)):
        calc(ws.cell(r, 4), f'=IF(A{r}="","",N(B{r})-N(C{r}))', MONEY)
        calc(ws.cell(r, 5), f'=IF(OR(A{r}="",N(B{r})=0),"",N(C{r})/B{r})', PCT, align=Alignment(horizontal="center", vertical="center"))
        bar(ws.cell(r, 6), f'=IF(E{r}="","",{BAR(f"E{r}")})')
    for col in (4, 5, 6):
        style(ws.cell(B_UNCAT, col), fill_=WHITE)
    tr = B_TOT
    ws.cell(tr, 1, "TOTAL")
    vals = {2: f"=SUM(B{B_GIFT}:B{B1})", 3: f"=SUM(C{B_GIFT}:C{B_UNCAT})", 4: f"=B{tr}-C{tr}",
            5: f'=IF(B{tr}=0,"",C{tr}/B{tr})', 6: f'=IF(E{tr}="","",{BAR(f"E{tr}")})'}
    for col in range(1, 7):
        c = ws.cell(tr, col, vals.get(col, ws.cell(tr, col).value))
        style(c, font=Font(name=SANS, size=10 if col < 6 else 9, bold=col < 6, color=WHITE if col < 6 else GOLD), fill_=PINE,
              fmt={2: MONEY, 3: MONEY, 4: MONEY, 5: PCT}.get(col),
              align=Alignment(horizontal="center", vertical="center") if col == 5 else None)
    neg_red(ws, f"D{B_GIFT}:D{B1}", f"D{B_GIFT}")
    ws.conditional_formatting.add(f"E{B_GIFT}:E{B1}", FormulaRule(formula=[f'AND(ISNUMBER(E{B_GIFT}),E{B_GIFT}>1)'], font=Font(color=BERRY, bold=True)))
    ws.conditional_formatting.add(f"F{B_GIFT}:F{B1}", FormulaRule(formula=[f'AND(ISNUMBER(E{B_GIFT}),E{B_GIFT}>1)'], font=Font(color=BERRY)))
    note = ws.cell(tr + 2, 1, "Tip: the Gifts budget adds up the budgets on the People tab. Type over it if you prefer one number. "
                              "Rename any category (or use the empty cream rows); the Expense Log dropdown follows.")
    note.font = Font(name=SANS, size=9, italic=True, color=SOFT)
    ws.merge_cells(start_row=tr + 2, start_column=1, end_row=tr + 3, end_column=6)
    note.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "B5"
    print_setup(ws, landscape=False)

    # ---------------- Expense Log ----------------
    ws = el
    title(ws, "Holiday Expense Log", "Everything that isn't a gift: food, decorations, cards, travel... Gifts go in the Gift Tracker.", 6)
    header(ws, 4, ["Date", "What", "Category", "Amount", "Paid with", "Running total"], [14, 32, 22, 12, 16, 14])
    for r in range(E0, E1 + 1):
        inp(ws.cell(r, 1), DATEF); inp(ws.cell(r, 2)); inp(ws.cell(r, 3)); inp(ws.cell(r, 4), MONEY); inp(ws.cell(r, 5))
        calc(ws.cell(r, 6), f'=IF(D{r}="","",SUM($D${E0}:D{r}))', MONEY, color=SOFT)
    list_dv(ws, f"C{E0}:C{E1}", f"={rng(BU,'A',B0,B1)}", "This category is not on the Budget tab, so it will show as 'Not in a category'.")
    ws.freeze_panes = f"A{E0}"
    print_setup(ws, landscape=False)

    # ---------------- Savings ----------------
    ws = sav
    title(ws, "Christmas Savings Plan", "Set a goal and a start date; it works out how much to put aside each week.", 6)
    for c_, w in zip("ABCDEF", [24, 16, 14, 14, 16, 26]):
        ws.column_dimensions[c_].width = w
    labels = [(4, "Savings goal"), (5, "Start saving on"), (6, "Christmas"), (7, "Weeks to save"), (8, "Save each week")]
    for r, lab in labels:
        c = ws.cell(r, 1, lab)
        style(c, font=Font(name=SANS, size=10, bold=True, color=INK), fill_=FROST)
    inp(ws["B4"], MONEY); inp(ws["B5"], DATEF)
    calc(ws["B6"], '=IF(B5="","",DATE(YEAR(B5)+IF(B5>DATE(YEAR(B5),12,25),1,0),12,25))', DATEF)
    calc(ws["B7"], '=IF(B6="","",MAX(1,ROUNDUP((B6-B5)/7,0)))', "0")
    calc(ws["B8"], '=IF(OR(B4="",B7=""),"",B4/B7)', MONEY, bold=True, color=BERRY)
    side = [(4, "Saved so far", f"=SUM(D{S0}:D{S1})", MONEY), (5, "Still to save", '=IF(B4="","",MAX(0,B4-D4))', MONEY),
            (6, "% of goal", '=IF(N(B4)=0,"",D4/B4)', PCT)]
    for r, lab, f, fmt in side:
        c = ws.cell(r, 3, lab)
        style(c, font=Font(name=SANS, size=10, bold=True, color=INK), fill_=FROST)
        calc(ws.cell(r, 4), f, fmt, bold=True)
    bar(ws["E6"], f'=IF(D6="","",{BAR("D6")})')
    ws.merge_cells("E6:F6")
    header(ws, 9, ["Week", "Week of", "Plan", "Saved", "Total saved", "On track?"], [24, 16, 14, 14, 16, 26])
    for r in range(S0, S1 + 1):
        n = r - S0 + 1
        ctr = Alignment(horizontal="center", vertical="center")
        calc(ws.cell(r, 1), f'=IF(OR($B$7="",{n}>$B$7),"",{n})', align=ctr)
        calc(ws.cell(r, 2), f'=IF(A{r}="","",$B$5+7*(A{r}-1))', DATEF)
        calc(ws.cell(r, 3), f'=IF(A{r}="","",$B$8)', MONEY)
        inp(ws.cell(r, 4), MONEY)
        calc(ws.cell(r, 5), f'=IF(A{r}="","",SUM($D${S0}:D{r}))', MONEY)
        calc(ws.cell(r, 6), f'=IF(OR(A{r}="",D{r}=""),"",IF(E{r}+0.005>=$B$8*A{r},"On track ✓","Behind by "&TEXT($B$8*A{r}-E{r},"$#,##0.00")))')
    ws.conditional_formatting.add(f"F{S0}:F{S1}", FormulaRule(formula=[f'LEFT(F{S0},6)="Behind"'], font=Font(color=BERRY, bold=True)))
    ws.conditional_formatting.add(f"F{S0}:F{S1}", FormulaRule(formula=[f'LEFT(F{S0},2)="On"'], font=Font(color=PINE, bold=True)))
    ws.freeze_panes = f"A{S0}"
    print_setup(ws, landscape=False)

    # ---------------- Dashboard ----------------
    ws = dash
    title(ws, "Christmas Gift & Budget Tracker", "Your Christmas at a glance. Everything on this page fills in by itself.", 6)
    for c_, w in zip("ABCDEF", [28, 16, 4, 28, 16, 28]):
        ws.column_dimensions[c_].width = w
    ws.column_dimensions["F"].width = 28

    def section(r, col, text):
        c = ws.cell(r, col, text)
        style(c, font=Font(name=SERIF, size=13, bold=True, color=BERRY), border=False)

    def kv(r, col, label, f, fmt=None, big=False, color=INK):
        a = ws.cell(r, col, label)
        style(a, font=Font(name=SANS, size=10, color=SOFT), fill_=FROST)
        calc(ws.cell(r, col + 1), f, fmt, bold=True, color=color,
             align=Alignment(horizontal="right", vertical="center"))
        if big:
            ws.cell(r, col + 1).font = Font(name=SERIF, size=14, bold=True, color=color)
            ws.row_dimensions[r].height = 24

    ws["A4"] = '=IF(TODAY()>DATE(YEAR(TODAY()),12,25),DATE(YEAR(TODAY())+1,12,25),DATE(YEAR(TODAY()),12,25))-TODAY()'
    ws["A4"].number_format = '0" days until Christmas"'
    ws["A4"].font = Font(name=SERIF, size=16, bold=True, color=PINE)
    ws.merge_cells("A4:B4")
    ws.row_dimensions[4].height = 30

    section(6, 1, "Money")
    kv(7, 1, "Total budget", f"={BU}!B{B_TOT}", MONEY, big=True)
    kv(8, 1, "Spent so far", f"={BU}!C{B_TOT}", MONEY, big=True)
    kv(9, 1, "Left to spend", f"={BU}!D{B_TOT}", MONEY, big=True, color=PINE)
    kv(10, 1, "Budget used", f"={BU}!E{B_TOT}", PCT)
    bar(ws["A11"], f'=IF(B10="","",{BAR("B10")})'); ws.merge_cells("A11:B11")
    neg_red(ws, "B9", "B9")

    section(6, 4, "Gifts")
    gifts = f"COUNTA({rng(GT,'B',G0,G1)})"
    kv(7, 4, "People on your list", f"=COUNTA({rng(PE,'A',P0,P1)})")
    kv(8, 4, "Gifts on the list", f"={gifts}")
    kv(9, 4, "Bought", f'=COUNTIF({rng(GT,"E",G0,G1)},"Yes")')
    bar(ws["F9"], f'=IF({gifts}=0,"",{BAR(f"E9/{gifts}")})')
    kv(10, 4, "Wrapped", f'=COUNTIF({rng(GT,"F",G0,G1)},"Yes")')
    bar(ws["F10"], f'=IF({gifts}=0,"",{BAR(f"E10/{gifts}")})')
    kv(11, 4, "Given", f'=COUNTIF({rng(GT,"G",G0,G1)},"Yes")')
    bar(ws["F11"], f'=IF({gifts}=0,"",{BAR(f"E11/{gifts}")})')
    kv(12, 4, "People over budget", f'=COUNTIF({rng(PE,"K",P0,P1)},"Over budget")')
    ws.conditional_formatting.add("E12", FormulaRule(formula=["E12>0"], font=Font(color=BERRY, bold=True)))

    section(13, 1, "Savings")
    kv(14, 1, "Savings goal", f'=IF({SA}!B4="","",{SA}!B4)', MONEY)
    kv(15, 1, "Saved so far", f"={SA}!D4", MONEY)
    bar(ws["A16"], f'=IF({SA}!D6="","",{BAR(f"{SA}!D6")})'); ws.merge_cells("A16:B16")

    section(14, 4, "Spending by category")
    for c_, h in zip((4, 5, 6), ("Category", "Spent", "of budget")):
        c = ws.cell(15, c_, h)
        style(c, font=Font(name=SANS, size=9, bold=True, color=WHITE), fill_=BERRY)
    for i, r in enumerate(range(B_GIFT, B1 + 1)):
        rr = 16 + i
        calc(ws.cell(rr, 4), f'=IF({BU}!A{r}="","",{BU}!A{r})')
        calc(ws.cell(rr, 5), f'=IF({BU}!A{r}="","",{BU}!C{r})', MONEY)
        bar(ws.cell(rr, 6), f'={BU}!F{r}')

    section(19, 1, "Checks")
    kv(20, 1, "Expenses not in a category", f"={BU}!C{B_UNCAT}", MONEY)
    kv(21, 1, "Gifts for names not on People", f"=COUNTA({rng(GT,'A',G0,G1)})-{PE}!G{T}")
    ws.conditional_formatting.add("B20:B21", FormulaRule(formula=["B20<>0"], font=Font(color=BERRY, bold=True)))
    n = ws.cell(22, 1, "Both should be 0. If not, check spelling on the Gift Tracker and Expense Log.")
    n.font = Font(name=SANS, size=9, italic=True, color=SOFT)
    ws.merge_cells("A22:B23"); n.alignment = Alignment(wrap_text=True, vertical="top")
    print_setup(ws)
    ws.page_setup.fitToHeight = 1
    ws.print_area = "A1:F28"

    # ---------------- Start Here ----------------
    ws = start
    title(ws, "Christmas Gift & Budget Tracker", "Quiet Table Co.  ·  Excel + Google Sheets  ·  Made for one household, for personal use", 2)
    ws.column_dimensions["A"].width = 6
    ws.column_dimensions["B"].width = 100
    rows = [
        ("h", "Open it"),
        ("p", "Google Sheets: go to sheets.google.com, then File > Import > Upload and pick this file (or upload it to Google Drive, "
              "open it and choose File > Save as Google Sheets)."),
        ("p", "Excel: double-click the file. If you see a yellow 'Protected View' bar, click Enable Editing."),
        ("p", "Tip: keep this file as your clean copy and use File > Save as (or Make a copy) for this year."),
        ("h", "Colors"),
        ("key", "Cream cells: type here."),
        ("p", "White cells calculate by themselves. Please don't type over them (except the Gifts budget, see the Budget tab)."),
        ("h", "Five steps"),
        ("n", "1. People: list everyone you're buying for, with a budget for each."),
        ("n", "2. Gift Tracker: add gift ideas. Pick the person from the dropdown and type a price."),
        ("n", "3. When you buy, wrap or give a gift, set Bought?, Wrapped? or Given? to Yes."),
        ("n", "4. Budget: set a budget for food, decorations, cards and the rest; log those costs in the Expense Log."),
        ("n", "5. Dashboard: see what's spent, what's left and how many gifts are still to buy. Savings plan optional."),
        ("h", "How the totals work"),
        ("p", "Spent counts only gifts marked Bought = Yes. Planned counts every gift on the list, so you can see the total before you shop."),
        ("p", "Gifts are tracked in the Gift Tracker only. Log everything else (food, wrapping, travel...) in the Expense Log, so nothing is counted twice."),
        ("p", "Room for 50 people, 300 gifts, 400 expenses and 52 savings weeks. Need more? Insert rows in the middle of a list (not below it) so the totals include them."),
        ("p", "Not in US dollars? Select the money columns, then Format > Number > Currency (Google Sheets) or Home > Number format (Excel)."),
        ("h", "Good to know"),
        ("p", "There's an example copy with sample data (Christmas-Gift-Budget-Tracker-Example.xlsx) so you can see it filled in."),
        ("p", "This is a digital file for personal use. Please don't resell or share it. Questions? Message us on Etsy; we're happy to help."),
        ("p", "Merry Christmas from Quiet Table Co."),
    ]
    r = 4
    for kind, text in rows:
        c = ws.cell(r, 2, text)
        if kind == "h":
            c.font = Font(name=SERIF, size=13, bold=True, color=BERRY)
            ws.row_dimensions[r].height = 26
            r += 1
            continue
        c.font = Font(name=SANS, size=10, color=INK, bold=(kind == "n"))
        c.alignment = Alignment(wrap_text=True, vertical="center")
        if kind == "key":
            ws.cell(r, 1).fill = fill(CREAM); ws.cell(r, 1).border = BOX
        ws.row_dimensions[r].height = 30 if len(text) > 95 else 18
        r += 1
    print_setup(ws, landscape=False)

    if sample:
        fill_sample(ppl, gt, bud, el, sav)
    wb.active = 0
    wb.calculation.fullCalcOnLoad = True   # Excel computes every formula when the file opens
    return wb


def fill_sample(ppl, gt, bud, el, sav):
    people = [("Mom", "Family", 120), ("Dad", "Family", 120), ("Emma", "Kids", 150), ("Leo", "Kids", 150),
              ("Grandma Jo", "Family", 60), ("Aunt Sara", "Family", 40), ("Sam (Secret Santa)", "Work", 25),
              ("Ms. Rivera (teacher)", "School", 20), ("Neighbors", "Neighbors", 30), ("Best friend Kim", "Friends", 50)]
    for i, (n, g, b) in enumerate(people):
        r = P0 + i
        ppl.cell(r, 1, n); ppl.cell(r, 2, g); ppl.cell(r, 3, b)
    gifts = [
        ("Mom", "Cozy cardigan", "Department store", 54.00, "Yes", "Yes", ""),
        ("Mom", "Cookbook", "Bookshop", 28.50, "Yes", "No", ""),
        ("Mom", "Hand cream set", "Pharmacy", 18.00, "No", "No", ""),
        ("Dad", "Coffee grinder", "Online", 69.99, "Yes", "Yes", ""),
        ("Dad", "Wool socks", "Outdoor shop", 16.00, "Yes", "Yes", ""),
        ("Dad", "Puzzle, 1000 pieces", "Toy store", 22.00, "No", "No", ""),
        ("Emma", "Art set", "Craft store", 34.99, "Yes", "Yes", ""),
        ("Emma", "Ice skates", "Sports store", 79.00, "Yes", "No", "Order #48213, arrives Dec 9"),
        ("Emma", "Chapter book series", "Bookshop", 24.00, "No", "No", ""),
        ("Emma", "Pajamas", "Online", 19.50, "Yes", "Yes", ""),
        ("Leo", "Building blocks set", "Toy store", 59.99, "Yes", "Yes", ""),
        ("Leo", "Rain boots", "Shoe store", 32.00, "Yes", "No", ""),
        ("Leo", "Picture books (2)", "Bookshop", 21.00, "Yes", "Yes", ""),
        ("Leo", "Remote-control car", "Online", 44.00, "Yes", "No", "Hide in garage"),
        ("Grandma Jo", "Photo calendar", "Print shop", 29.00, "Yes", "Yes", ""),
        ("Grandma Jo", "Tea sampler", "Tea shop", 24.00, "Yes", "Yes", ""),
        ("Grandma Jo", "Scarf", "Market", 22.00, "Yes", "No", ""),
        ("Aunt Sara", "Candle", "Gift shop", 26.00, "Yes", "Yes", ""),
        ("Sam (Secret Santa)", "Desk plant", "Garden center", 22.00, "Yes", "Yes", "Limit $25"),
        ("Ms. Rivera (teacher)", "Gift card + card from Leo", "Coffee shop", 20.00, "Yes", "Yes", ""),
        ("Neighbors", "Homemade cookie tins (3)", "Baking", 18.00, "Yes", "No", ""),
        ("Best friend Kim", "Concert tickets (half)", "Online", 45.00, "Yes", "Yes", ""),
        ("Best friend Kim", "Card game", "Game shop", 15.00, "No", "No", ""),
    ]
    for i, row in enumerate(gifts):
        r = G0 + i
        for col, v in enumerate(row[:4], start=1):
            gt.cell(r, col, v)
        gt.cell(r, 5, row[4]); gt.cell(r, 6, row[5])
        if row[6]:
            gt.cell(r, 8, row[6])   # notes
    # a few given gifts
    gt.cell(G0 + 18, 7, "Yes"); gt.cell(G0 + 19, 7, "Yes")
    budgets = [250, 80, 30, 40, 100, 200, 60, 50, 40, 30]
    for i, b in enumerate(budgets):
        bud.cell(B0 + i, 2, b)
    exp = [
        (date(2026, 11, 2), "Advent candles + garland", "Decorations", 34.50, "Debit card"),
        (date(2026, 11, 8), "Christmas cards (box of 40)", "Cards & postage", 18.99, "Cash"),
        (date(2026, 11, 8), "Stamps", "Cards & postage", 27.20, "Cash"),
        (date(2026, 11, 15), "Wrapping paper, tape, ribbon", "Wrapping & tags", 24.75, "Debit card"),
        (date(2026, 11, 22), "Train tickets to Grandma's", "Travel", 136.00, "Credit card"),
        (date(2026, 11, 29), "Tree", "Decorations", 65.00, "Cash"),
        (date(2026, 12, 3), "Baking supplies", "Food & treats", 42.30, "Debit card"),
        (date(2026, 12, 6), "Food bank donation", "Charity & giving", 40.00, "Debit card"),
        (date(2026, 12, 10), "Holiday party snacks", "Parties & hosting", 58.40, "Credit card"),
        (date(2026, 12, 13), "Ice rink tickets", "Kids' activities", 32.00, "Debit card"),
        (date(2026, 12, 14), "Matching sweaters", "Outfits", 72.00, "Credit card"),
    ]
    for i, row in enumerate(exp):
        for col, v in enumerate(row, start=1):
            el.cell(E0 + i, col, v)
    sav["B4"] = 600
    sav["B5"] = date(2026, 9, 7)
    for i, v in enumerate([40, 40, 35, 40, 20, 40, 40, 30]):
        sav.cell(S0 + i, 4, v)


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out.mkdir(parents=True, exist_ok=True)
    build(False).save(out / "Christmas-Gift-Budget-Tracker.xlsx")
    build(True).save(out / "Christmas-Gift-Budget-Tracker-Example.xlsx")
    print("wrote", out)
