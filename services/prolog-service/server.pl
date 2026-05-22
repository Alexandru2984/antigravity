:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(option)).
:- use_module(rules).

:- http_handler(root(health), handle_health, []).
:- http_handler(root(check_fraud), handle_fraud, []).
:- http_handler(root(.), handle_health, []).

handle_health(_Request) :-
    reply_json_dict(_{status: "ok", service: "prolog-fraud"}).

handle_fraud(Request) :-
    http_read_json_dict(Request, Dict),
    dict_value(Dict, title, "", Title),
    dict_value(Dict, category, "general", Category),
    dict_value(Dict, price, 0, Price),
    dict_value(Dict, seller_id, "", SellerId),
    dict_value(Dict, location, "", Location),
    fraud_report(Title, Category, Price, SellerId, Location, Report),
    reply_json_dict(Report).

dict_value(Dict, Key, Default, Value) :-
    (   get_dict(Key, Dict, Existing)
    ->  Value = Existing
    ;   Value = Default
    ).

server(Port) :-
    http_server(http_dispatch, [port(Port)]),
    thread_get_message(_).

:- initialization(server(4055)).
