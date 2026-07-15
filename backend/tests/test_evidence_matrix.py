from pathlib import Path


def test_plan_evidence_matrix_covers_required_requirements() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    plan_path = repo_root / "specs" / "001-databricks-apps-enterprise-feasibility" / "plan.md"
    contents = plan_path.read_text(encoding="utf-8")

    required_requirements = [
        "FR-002",
        "FR-003",
        "FR-004",
        "FR-005",
        "FR-006",
        "FR-008",
        "FR-009",
        "FR-010",
        "FR-011",
    ]

    for requirement_id in required_requirements:
        assert requirement_id in contents, f"Missing evidence mapping for {requirement_id}"

    assert "decision-scorecard.md" in contents
