:- module(rules, [fraud_report/6]).

risk_rule(price_too_low_for_electronics, Listing, 45, "electronics under reference floor") :-
    _{price: Price, category: Category} :< Listing,
    Category == "electronics",
    Price < 100.

risk_rule(price_too_high_for_general, Listing, 25, "general listing over reference ceiling") :-
    _{price: Price, category: Category} :< Listing,
    Category == "general",
    Price > 10000.

risk_rule(suspicious_title, Listing, 20, Keyword) :-
    _{title: Title} :< Listing,
    string_lower(Title, Lower),
    suspicious_keyword(Keyword),
    sub_string(Lower, _, _, _, Keyword).

risk_rule(missing_location, Listing, 10, "empty location") :-
    _{location: Location} :< Listing,
    normalize_space(string(Trimmed), Location),
    Trimmed == "".

risk_rule(default_seller_identity, Listing, 15, "default seller uuid") :-
    _{seller_id: SellerId} :< Listing,
    sub_string(SellerId, _, _, _, "00000000-0000-0000").

suspicious_keyword("urgent").
suspicious_keyword("wire transfer").
suspicious_keyword("no warranty").
suspicious_keyword("too cheap").

fraud_report(Title, Category, Price, SellerId, Location, Report) :-
    Listing = _{
        title: Title,
        category: Category,
        price: Price,
        seller_id: SellerId,
        location: Location
    },
    findall(
        _{rule: Rule, points: Points, evidence: Evidence},
        risk_rule(Rule, Listing, Points, Evidence),
        Rules
    ),
    sum_points(Rules, Score),
    risk_status(Score, Status),
    Report = _{
        service: "prolog-fraud",
        status: Status,
        risk_score: Score,
        triggered_rules: Rules
    }.

sum_points([], 0).
sum_points([Rule | Rest], Total) :-
    Points = Rule.points,
    sum_points(Rest, RestTotal),
    Total is Points + RestTotal.

risk_status(Score, "blocked") :- Score >= 60, !.
risk_status(Score, "review") :- Score >= 25, !.
risk_status(_, "ok").
