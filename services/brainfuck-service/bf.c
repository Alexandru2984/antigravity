#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
    if (argc < 2) return 1;
    FILE *f = fopen(argv[1], "r");
    if (!f) return 1;
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *code = malloc(size + 1);
    fread(code, 1, size, f);
    fclose(f);
    code[size] = 0;

    char cells[30000] = {0};
    char *ptr = cells;
    for (char *pc = code; *pc; pc++) {
        switch (*pc) {
            case '>': ++ptr; break;
            case '<': --ptr; break;
            case '+': ++(*ptr); break;
            case '-': --(*ptr); break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[': if (!*ptr) { int b = 1; while (b) { pc++; if (*pc == '[') b++; else if (*pc == ']') b--; } } break;
            case ']': if (*ptr) { int b = 1; while (b) { pc--; if (*pc == '[') b--; else if (*pc == ']') b++; } } break;
        }
    }
    return 0;
}
