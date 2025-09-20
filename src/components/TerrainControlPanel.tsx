import React, { useState } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { useTerrainControls } from '../hooks/useTerrainControls';

export function TerrainControlPanel() {
  const {
    state,
    availableProfiles,
    currentProfile,
    developmentRecommendations,
    isCustomProfile,
    canShowAtmosphere,
    terrainDifficulty,
    currentScaleDescription,
    currentTimeDescription,

    toggleTerrain,
    setScale,
    setSeed,
    setTimeOfDay,
    toggleAtmosphere,
    toggleAutoRegenerate,
    setTerrainProfile,
    setMountainHeight,
    setWaterLevel,
    setHilliness,
    setRiverProbability,
    setCoastalDistance,
    regenerateTerrain,
    resetToDefaults,
    exportConfiguration,
    importConfiguration
  } = useTerrainControls();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleSeedInput = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSeed(numValue);
    }
  };

  const handleExportConfig = () => {
    const config = exportConfiguration();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrain-config-${state.terrainProfile}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          importConfiguration(config);
        } catch (error) {
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <DraggablePanel
      title="🏔️ Terrain Controls"
      defaultPosition={{ x: 350, y: 20 }}
      defaultSize={{ width: 340, height: 650 }}
      isCollapsible={true}
      initiallyCollapsed={false}
      storageKey="terrain-controls"
      panelType="terrain"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Master Toggle */}
        <div className="control-group">
          <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={state.isEnabled}
              onChange={(e) => toggleTerrain(e.target.checked)}
            />
            <span>Enable Terrain System</span>
          </label>
        </div>

        {state.isEnabled && (
          <>
            {/* Terrain Profile Selection */}
            <div className="control-group">
              <label className="control-label">Terrain Profile</label>
              <select
                value={state.terrainProfile}
                onChange={(e) => setTerrainProfile(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                {availableProfiles.map(profile => (
                  <option key={profile.value} value={profile.value}>
                    {profile.label} {profile.difficulty === 'challenging' ? '⚠️' : profile.difficulty === 'moderate' ? '📊' : '✅'}
                  </option>
                ))}
              </select>

              {currentProfile && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  background: 'var(--background-color)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div><strong>{currentProfile.description}</strong></div>
                  <div style={{ marginTop: '0.25rem' }}>
                    Difficulty: <span style={{
                      color: terrainDifficulty === 'challenging' ? 'var(--error-color)' :
                             terrainDifficulty === 'moderate' ? 'var(--warning-color)' : 'var(--success-color)'
                    }}>
                      {terrainDifficulty}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Scale Control */}
            <div className="control-group">
              <label className="control-label">
                Scale: {currentScaleDescription} ({state.scale}x)
              </label>
              <input
                type="range"
                min="1"
                max="1000"
                step="1"
                value={state.scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="speed-slider"
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '0.25rem'
              }}>
                <span>City</span>
                <span>Regional</span>
                <span>Planetary</span>
              </div>
            </div>

            {/* Seed Control */}
            <div className="control-group">
              <label className="control-label">Terrain Seed</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={state.seed}
                  onChange={(e) => handleSeedInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    background: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={regenerateTerrain}
                  className="button button-secondary"
                  style={{ padding: '0.5rem 0.75rem', minWidth: '40px' }}
                  title="Generate random seed"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Time of Day */}
            <div className="control-group">
              <label className="control-label">
                Time: {state.timeOfDay.toString().padStart(2, '0')}:00 ({currentTimeDescription})
              </label>
              <input
                type="range"
                min="0"
                max="23"
                step="1"
                value={state.timeOfDay}
                onChange={(e) => setTimeOfDay(parseInt(e.target.value))}
                className="speed-slider"
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '0.25rem'
              }}>
                <span>🌅 6AM</span>
                <span>☀️ 12PM</span>
                <span>🌅 6PM</span>
                <span>🌙 12AM</span>
              </div>
            </div>

            {/* Atmosphere Toggle */}
            {canShowAtmosphere && (
              <div className="control-group">
                <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={state.showAtmosphere}
                    onChange={(e) => toggleAtmosphere(e.target.checked)}
                  />
                  <span>Show Atmospheric Effects</span>
                </label>
              </div>
            )}

            {/* Auto-regenerate City */}
            <div className="control-group">
              <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={state.autoRegenerateCity}
                  onChange={(e) => toggleAutoRegenerate(e.target.checked)}
                />
                <span>Auto-regenerate City</span>
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Automatically regenerate city when terrain changes
              </div>
            </div>

            {/* Custom Parameters (only for custom profile) */}
            {isCustomProfile && (
              <div className="control-group">
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  borderRadius: 'var(--border-radius)',
                  textAlign: 'center'
                }}>
                  Custom Parameters
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="control-label">
                      Mountain Height: {state.customParameters.mountainHeight}m
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={state.customParameters.mountainHeight}
                      onChange={(e) => setMountainHeight(parseInt(e.target.value))}
                      className="speed-slider"
                    />
                  </div>

                  <div>
                    <label className="control-label">
                      Water Level: {state.customParameters.waterLevel}m
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="50"
                      step="5"
                      value={state.customParameters.waterLevel}
                      onChange={(e) => setWaterLevel(parseInt(e.target.value))}
                      className="speed-slider"
                    />
                  </div>

                  <div>
                    <label className="control-label">
                      Hilliness: {(state.customParameters.hilliness * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={state.customParameters.hilliness}
                      onChange={(e) => setHilliness(parseFloat(e.target.value))}
                      className="speed-slider"
                    />
                  </div>

                  <div>
                    <label className="control-label">
                      River Probability: {(state.customParameters.riverProbability * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={state.customParameters.riverProbability}
                      onChange={(e) => setRiverProbability(parseFloat(e.target.value))}
                      className="speed-slider"
                    />
                  </div>

                  <div>
                    <label className="control-label">
                      Coastal Distance: {(state.customParameters.coastalDistance / 1000).toFixed(1)}km
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="100000"
                      step="500"
                      value={state.customParameters.coastalDistance}
                      onChange={(e) => setCoastalDistance(parseInt(e.target.value))}
                      className="speed-slider"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Development Recommendations */}
            {developmentRecommendations && (
              <div className="control-group">
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="button button-secondary"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  {showRecommendations ? '📋 Hide' : '📋 Show'} Development Guidelines
                </button>

                {showRecommendations && (
                  <div style={{
                    background: 'var(--background-color)',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>🏢 Downtown:</strong> {developmentRecommendations.downtown}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>🏠 Residential:</strong> {developmentRecommendations.residential}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>🏭 Industrial:</strong> {developmentRecommendations.industrial}
                    </div>
                    <div>
                      <strong>🛣️ Transportation:</strong> {developmentRecommendations.transportation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Controls */}
            <div className="control-group">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="button button-secondary"
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                {showAdvanced ? '⚙️ Hide' : '⚙️ Show'} Advanced Controls
              </button>

              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleExportConfig}
                      className="button button-secondary"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      💾 Export
                    </button>
                    <label className="button button-secondary" style={{ flex: 1, fontSize: '0.75rem', cursor: 'pointer' }}>
                      📂 Import
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportConfig}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="control-group">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={regenerateTerrain}
                  className="button button-primary"
                  style={{ flex: 1 }}
                >
                  🔄 Regenerate
                </button>
                <button
                  onClick={resetToDefaults}
                  className="button button-secondary"
                  style={{ flex: 1 }}
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Status Display */}
            <div style={{
              background: 'var(--background-color)',
              padding: '0.75rem',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Profile:</strong> {currentProfile?.name || 'Custom'}</div>
                <div><strong>Scale:</strong> {currentScaleDescription}</div>
                <div><strong>Layer:</strong> {state.activeLayer}</div>
                <div><strong>Seed:</strong> {state.seed}</div>
                <div><strong>Time:</strong> {currentTimeDescription}</div>
                <div><strong>Difficulty:</strong> {terrainDifficulty}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </DraggablePanel>
  );
}