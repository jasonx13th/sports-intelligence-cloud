import re
import sys

PARTITION_PATTERN = r"tenant_id=([^/]+)/dt=([^/]+)/[^/]+$"


def get_job_args(argv=None):
    from awsglue.utils import getResolvedOptions

    argv = argv if argv is not None else sys.argv
    args = getResolvedOptions(argv, ["LAKE_BUCKET", "BRONZE_PREFIX", "SILVER_PREFIX"])
    return args["LAKE_BUCKET"], args["BRONZE_PREFIX"].rstrip("/"), args["SILVER_PREFIX"].rstrip("/")


def build_source_path(lake_bucket: str, bronze_prefix: str) -> str:
    return f"s3://{lake_bucket}/{bronze_prefix}/tenant_id=*/dt=*/"


def build_silver_path(lake_bucket: str, silver_prefix: str) -> str:
    return f"s3://{lake_bucket}/{silver_prefix}/"


def extract_partition_values(source_path: str):
    match = re.search(PARTITION_PATTERN, source_path)
    return (match.group(1), match.group(2)) if match else (None, None)


def main():
    from pyspark.sql import SparkSession
    from pyspark.sql.functions import col, input_file_name, regexp_extract

    lake_bucket, bronze_prefix, silver_prefix = get_job_args()
    spark = SparkSession.builder.appName("sic-bronze-to-silver-sessions").getOrCreate()
    spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")

    source_path = build_source_path(lake_bucket, bronze_prefix)
    df = spark.read.option("mode", "DROPMALFORMED").json(source_path)
    df = (
        df.withColumn("source_path", input_file_name())
        .withColumn("tenant_id", regexp_extract(col("source_path"), PARTITION_PATTERN, 1))
        .withColumn("dt", regexp_extract(col("source_path"), PARTITION_PATTERN, 2))
    )
    df = df.filter(
        col("tenant_id").isNotNull()
        & (col("tenant_id") != "")
        & col("dt").isNotNull()
        & (col("dt") != "")
    )

    if df.rdd.isEmpty():
        print(f"No valid bronze session records found at {source_path}")
        return

    output_path = build_silver_path(lake_bucket, silver_prefix)
    df.drop("source_path").write.mode("overwrite").option("overwriteSchema", "true").partitionBy("tenant_id", "dt").parquet(output_path)
    print(f"Wrote silver session parquet to {output_path}")


if __name__ == "__main__":
    main()
