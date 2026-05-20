:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).

server(Port) :-
    http_server(http_dispatch, [port(Port)]).

:- http_handler(/, say_hello, []).

say_hello(_Request) :-
    format('Content-type: text/plain~n~n'),
    format('Prolog Logic Engine: Status OK, Rules Loaded.~n').

:- initialization(server(4055)).
