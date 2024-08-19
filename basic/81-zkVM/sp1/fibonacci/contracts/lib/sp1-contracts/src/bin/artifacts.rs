use anyhow::Result;
use log::info;
use sp1_sdk::install::try_install_plonk_bn254_artifacts;
use sp1_sdk::utils::setup_logger;

fn main() -> Result<()> {
    dotenv::dotenv().ok();

    setup_logger();

    let artifacts_dir = try_install_plonk_bn254_artifacts();

    info!("Artifacts installed to: {:?}", artifacts_dir);

    // Read all Solidity files from the artifacts_dir.
    let sol_files = std::fs::read_dir(artifacts_dir)?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().extension().and_then(|ext| ext.to_str()) == Some("sol"))
        .collect::<Vec<_>>();

    // Write each Solidity file to the contracts directory.
    let contracts_src_dir = std::path::Path::new("contracts/src");
    for sol_file in sol_files {
        let sol_file_path = sol_file.path();
        let sol_file_contents = std::fs::read(&sol_file_path)?;
        std::fs::write(
            contracts_src_dir.join(sol_file_path.file_name().unwrap()),
            sol_file_contents,
        )?;
    }

    Ok(())
}
