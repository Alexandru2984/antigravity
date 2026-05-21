:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).

:- http_handler(root(check_fraud), handle_fraud, []).
:- http_handler(root(.), handle_home, []).

handle_home(_Request) :-
    reply_json_dict(_{status: "online", service: "prolog-fraud"}).

handle_fraud(Request) :-
    http_read_json_dict(Request, Dict),
    (   Dict.price < 100, Dict.category == "electronics"
    ->  Reply = _{status: "warning", reason: "Price too low for electronics"}
    ;   Reply = _{status: "ok", reason: "Safe listing"}
    ),
    reply_json_dict(Reply).

server(Port) :-
    http_server(http_dispatch, [port(Port)]),
    thread_get_message(_).

:- initialization(server(4055)).

