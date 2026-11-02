package com.taskflow.task.model;

/** Papéis em ordem crescente de permissão: VIEWER < EDITOR < OWNER. */
public enum ProjectRole {
    VIEWER,
    EDITOR,
    OWNER;

    public boolean atLeast(ProjectRole required) {
        return this.ordinal() >= required.ordinal();
    }
}
