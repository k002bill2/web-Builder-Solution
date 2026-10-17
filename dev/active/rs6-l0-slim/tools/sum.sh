#!/bin/zsh
# 측정 보조: build 출력에서 판정 수치 추출. 사용: tools-sum.sh <build.txt>
grep -E "^\[bundle\] /(catalog|profile|projects|studio)[^ ]* (\(저장 데이터 복원 진입\) )?첫 화면|해시 정규화 진입" "$1" | sed -E 's/\[bundle\] *//'
