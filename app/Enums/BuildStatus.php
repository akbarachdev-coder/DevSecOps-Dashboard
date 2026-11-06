<?php

namespace App\Enums;

enum BuildStatus: string
{
    case Passed = 'passed';
    case Failed = 'failed';
    case ActionRequired = 'action_required';
}
