cli() 
{
  src/clippy/clippy "$@"
}

###-begin-clippy-completions-###
#
# yargs command completion script
#
# Installation: src\clippy\clippy completion >> ~/.bashrc
#    or src\clippy\clippy completion >> ~/.bash_profile on OSX.
#
_clippy_yargs_completions()
{
    local cur_word args type_list

    cur_word="${COMP_WORDS[COMP_CWORD]}"
    args=("${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    cmd=(
      "${COMP_WORDS[@]:0:$((COMP_CWORD))}" \
      --get-yargs-completions \
      "${COMP_WORDS[COMP_CWORD]}"
    )
    type_list=$("${cmd[@]}")

    # echo >&2
    # echo "DEBUG: ${cmd[@]}" >&2

    COMPREPLY=( $(compgen -W "${type_list}" -- ${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ ${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o bashdefault -o default -F _clippy_yargs_completions cli
###-end-clippy-completions-###