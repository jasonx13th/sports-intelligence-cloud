from etl import build_source_path, build_silver_path, extract_partition_values


def test_build_source_path():
    assert (
        build_source_path("lake-bucket", "bronze/sessions/v=1")
        == "s3://lake-bucket/bronze/sessions/v=1/tenant_id=*/dt=*/"
    )


def test_build_silver_path():
    assert (
        build_silver_path("lake-bucket", "silver/sessions/v=1")
        == "s3://lake-bucket/silver/sessions/v=1/"
    )


def test_extract_partition_values():
    source_path = "s3://lake-bucket/bronze/sessions/v=1/tenant_id=ORG#123/dt=2026-03-30/sessions.ndjson"
    tenant_id, dt = extract_partition_values(source_path)
    assert tenant_id == "ORG#123"
    assert dt == "2026-03-30"


if __name__ == "__main__":
    test_build_source_path()
    test_build_silver_path()
    test_extract_partition_values()
    print("etl_test.py: all tests passed")
