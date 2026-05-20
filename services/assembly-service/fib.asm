section .text
global fib
fib:
    push rbp
    mov rbp, rsp
    mov rcx, rdi
    mov rax, 0
    mov rbx, 1
    cmp rcx, 0
    je .done
    cmp rcx, 1
    je .one
.loop:
    mov rdx, rax
    add rdx, rbx
    mov rax, rbx
    mov rbx, rdx
    dec rcx
    cmp rcx, 1
    jg .loop
    mov rax, rbx
    jmp .done
.one:
    mov rax, 1
.done:
    pop rbp
    ret
