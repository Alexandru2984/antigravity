       IDENTIFICATION DIVISION.
       PROGRAM-ID. BILLING.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-COMMAND-LINE      PIC X(64).
       01 WS-AMOUNT-CENTS      PIC 9(9) VALUE 0.
       01 WS-TAX-BPS           PIC 9(4) VALUE 1900.
       01 WS-TAX-CENTS         PIC 9(9) VALUE 0.
       01 WS-TOTAL-CENTS       PIC 9(9) VALUE 0.
       01 WS-AMOUNT-OUT        PIC Z(8)9.
       01 WS-TAX-OUT           PIC Z(8)9.
       01 WS-TOTAL-OUT         PIC Z(8)9.

       PROCEDURE DIVISION.
           ACCEPT WS-COMMAND-LINE FROM COMMAND-LINE.
           MOVE FUNCTION NUMVAL(WS-COMMAND-LINE) TO WS-AMOUNT-CENTS.

           COMPUTE WS-TAX-CENTS ROUNDED =
               WS-AMOUNT-CENTS * WS-TAX-BPS / 10000.
           COMPUTE WS-TOTAL-CENTS =
               WS-AMOUNT-CENTS + WS-TAX-CENTS.

           MOVE WS-AMOUNT-CENTS TO WS-AMOUNT-OUT.
           MOVE WS-TAX-CENTS TO WS-TAX-OUT.
           MOVE WS-TOTAL-CENTS TO WS-TOTAL-OUT.

           DISPLAY
               '{"service":"cobol-ledger",'
               '"tax_bps":' WS-TAX-BPS ','
               '"amount_cents":' FUNCTION TRIM(WS-AMOUNT-OUT) ','
               '"tax_cents":' FUNCTION TRIM(WS-TAX-OUT) ','
               '"total_cents":' FUNCTION TRIM(WS-TOTAL-OUT) '}'.

           STOP RUN.
