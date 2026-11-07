<?php

namespace App\Http\Requests;

use App\Enums\Severity;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IngestScanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'commit_hash' => ['required', 'string', 'max:40'],
            'branch' => ['required', 'string', 'max:100'],
            'app_version' => ['required', 'string', 'max:50'],
            'scanner_tool' => ['required', 'string', 'max:50'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'findings' => ['nullable', 'array'],
            'findings.*.vulnerability_id' => ['required', 'string', 'max:100'],
            'findings.*.title' => ['required', 'string', 'max:255'],
            'findings.*.description' => ['nullable', 'string'],
            'findings.*.severity' => ['required', Rule::enum(Severity::class)],
            'findings.*.package_name' => ['nullable', 'string', 'max:255'],
            'findings.*.installed_version' => ['nullable', 'string', 'max:100'],
            'findings.*.fixed_version' => ['nullable', 'string', 'max:100'],
            'findings.*.file_path' => ['nullable', 'string', 'max:500'],
            'findings.*.line_number' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
