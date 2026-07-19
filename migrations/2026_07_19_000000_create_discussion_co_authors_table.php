<?php

use Illuminate\Database\Schema\Blueprint;
use Flarum\Database\Migration;

return Migration::createTable(
    'discussion_co_authors',
    function (Blueprint $table) {
        $table->increments('id');
        $table->unsignedInteger('discussion_id');
        $table->unsignedInteger('user_id');
        $table->unsignedInteger('added_by_id')->nullable();
        $table->enum('status', ['pending', 'accepted'])->default('pending');
        $table->timestamp('created_at')->useCurrent();
        $table->timestamp('responded_at')->nullable();

        $table->foreign('discussion_id')->references('id')->on('discussions')->onDelete('cascade');
        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('added_by_id')->references('id')->on('users')->onDelete('set null');

        $table->unique(['discussion_id', 'user_id']);
        $table->index(['user_id', 'status']);
    }
);
