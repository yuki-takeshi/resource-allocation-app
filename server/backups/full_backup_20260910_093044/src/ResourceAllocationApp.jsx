import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Target,
  Zap,
  AlertCircle,
} from 'lucide-react';
import * as api from './api';

const ResourceAllocationApp = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初期データの読み込み
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, membersData] = await Promise.all([
        api.fetchProjects(),
        api.fetchMembers()
      ]);
      setProjects(projectsData || []);
      setMembers(membersData || []);
    } catch (err) {
      setError(err.message);
      console.error('データ読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  // マッチング機能：案件に適したメンバーを自動抽出
  const matchingCandidates = useMemo(() => {
    if (!selectedProject) return [];

    const project = projects.find((p) => p.id === selectedProject);
    if (!project) return [];

    const candidates = members
      .map((member) => {
        const startMonthAllocation = member.allocation[project.startMonth] || 0;
        const hasCapacity = startMonthAllocation <= 50;

        const matchedSkills = project.requiredSkills.filter(
          (skill) => member.skills[skill] && member.skills[skill] >= 3
        );
        const skillMatch = matchedSkills.length / project.requiredSkills.length;

        return {
          memberId: member.id,
          memberName: member.name,
          hasCapacity,
          allocation: startMonthAllocation,
          skillMatch: Math.round(skillMatch * 100),
          matchedSkills,
          allSkills: member.skills,
        };
      })
      .filter((c) => c.hasCapacity && c.skillMatch > 0)
      .sort((a, b) => b.skillMatch - a.skillMatch);

    return candidates;
  }, [selectedProject, projects, members]);

  // 案件の追加・編集
  const handleAddProject = async (newProject) => {
    try {
      await api.saveProject(newProject);
      await loadData();
      setShowProjectForm(false);
      setEditingProject(null);
    } catch (err) {
      setError('案件の保存に失敗しました: ' + err.message);
    }
  };

  // 案件の削除
  const handleDeleteProject = async (id) => {
    try {
      await api.deleteProject(id);
      await loadData();
      if (selectedProject === id) setSelectedProject(null);
    } catch (err) {
      setError('案件の削除に失敗しました: ' + err.message);
    }
  };

  // メンバーの追加・編集
  const handleSaveMember = async (memberData) => {
    try {
      await api.saveMember(memberData);
      await loadData();
      setShowMemberForm(false);
      setEditingMember(null);
    } catch (err) {
      setError('メンバーの保存に失敗しました: ' + err.message);
    }
  };

  // メンバーの削除
  const handleDeleteMember = async (id) => {
    try {
      await api.deleteMember(id);
      await loadData();
    } catch (err) {
      setError('メンバーの削除に失敗しました: ' + err.message);
    }
  };

  // 稼働率の更新
  const handleUpdateAllocation = async (memberId, month, rate) => {
    try {
      await api.saveAllocation(memberId, month, parseInt(rate));
      await loadData();
    } catch (err) {
      setError('稼働率の更新に失敗しました: ' + err.message);
    }
  };

  // スキルの更新
  const handleUpdateSkill = async (memberId, skill, level) => {
    try {
      await api.saveSkill(memberId, skill, parseInt(level));
      await loadData();
    } catch (err) {
      setError('スキルの更新に失敗しました: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 text-4xl">⟳</div>
          <p className="text-slate-300 text-lg">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">
              リソースアロケーション管理
            </h1>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-600/30 border border-red-500 rounded text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* タブナビゲーション */}
          <div className="flex gap-2 border-b border-slate-600">
            {[
              { id: 'projects', label: '案件パイプライン', icon: Briefcase },
              { id: 'allocation', label: '要員稼働状況', icon: TrendingUp },
              { id: 'skills', label: 'スキルマップ', icon: Zap },
              { id: 'members', label: 'メンバー管理', icon: Plus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setShowProjectForm(false);
                  setShowMemberForm(false);
                }}
                className={`px-4 py-3 font-medium flex items-center gap-2 transition-colors ${
                  activeTab === id
                    ? 'border-b-2 border-blue-400 text-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 案件パイプライン */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {!showProjectForm ? (
              <button
                onClick={() => {
                  setShowProjectForm(true);
                  setEditingProject(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                新規案件を追加
              </button>
            ) : (
              <ProjectForm
                project={editingProject}
                onSubmit={handleAddProject}
                onCancel={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                }}
              />
            )}

            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-slate-700/50 border rounded-lg p-5 transition-all cursor-pointer ${
                    selectedProject === project.id
                      ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>顧客: {project.customer}</span>
                        <span
                          className={`px-2 py-1 rounded text-white font-medium ${
                            project.confidence === 'A'
                              ? 'bg-green-600/30 text-green-300'
                              : project.confidence === 'B'
                              ? 'bg-yellow-600/30 text-yellow-300'
                              : 'bg-red-600/30 text-red-300'
                          }`}
                        >
                          確度{project.confidence}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setShowProjectForm(true);
                        }}
                        className="p-2 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Edit2 className="w-5 h-5 text-slate-300" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 hover:bg-red-600/20 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">開始時期</span>
                      <p className="font-semibold text-white">{project.startMonth}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">期間</span>
                      <p className="font-semibold text-white">{project.duration}ヶ月</p>
                    </div>
                    <div>
                      <span className="text-slate-400">必要工数</span>
                      <p className="font-semibold text-white">{project.requiredManMonths}人月</p>
                    </div>
                    <div>
                      <span className="text-slate-400">スキル要件</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedProject === project.id && (
                    <div className="mt-5 pt-5 border-t border-slate-600">
                      <h4 className="text-sm font-semibold text-white mb-3">
                        アサイン候補メンバー
                      </h4>
                      {matchingCandidates.length > 0 ? (
                        <div className="space-y-2">
                          {matchingCandidates.map((candidate) => (
                            <div
                              key={candidate.memberId}
                              className="bg-slate-800 p-3 rounded flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-white">
                                  {candidate.memberName}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                  <span>
                                    稼働率:{' '}
                                    <span className="text-green-400">
                                      {candidate.allocation}%
                                    </span>
                                  </span>
                                  <span>
                                    スキルマッチ:{' '}
                                    <span className="text-blue-400">
                                      {candidate.skillMatch}%
                                    </span>
                                  </span>
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {candidate.matchedSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-2 py-0.5 bg-green-600/30 text-green-300 text-xs rounded"
                                    >
                                      ✓{skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm">
                          条件に合致するメンバーはいません
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 要員稼働状況 */}
        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">要員稼働状況</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      メンバー名
                    </th>
                    {['2026-06', '2026-07', '2026-08'].map((month) => (
                      <th key={month} className="text-center py-3 px-4 text-slate-300 font-semibold">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-white font-medium">
                        {member.name}
                      </td>
                      {['2026-06', '2026-07', '2026-08'].map((month) => {
                        const allocation = member.allocation[month] || 0;
                        let color = 'bg-green-600/20 text-green-300';
                        if (allocation > 100) color = 'bg-red-600/20 text-red-300';
                        else if (allocation > 75)
                          color = 'bg-yellow-600/20 text-yellow-300';
                        else if (allocation > 50)
                          color = 'bg-blue-600/20 text-blue-300';

                        return (
                          <td key={month} className="text-center py-4 px-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    allocation > 100
                                      ? 'bg-red-500'
                                      : allocation > 75
                                      ? 'bg-yellow-500'
                                      : allocation > 50
                                      ? 'bg-blue-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(allocation, 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <input
                                type="number"
                                min="0"
                                max="200"
                                value={allocation}
                                onChange={(e) =>
                                  handleUpdateAllocation(
                                    member.id,
                                    month,
                                    e.target.value
                                  )
                                }
                                className={`px-2 py-1 rounded text-xs font-semibold w-12 bg-slate-700 text-white border border-slate-600 ${color}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 凡例 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm text-slate-300">50%以下（空きあり）</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm text-slate-300">50-75%</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span className="text-sm text-slate-300">75-100%</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-slate-300">100%以上（超過）</span>
              </div>
            </div>
          </div>
        )}

        {/* スキルマップ */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">スキルマップ</h2>
            <div className="space-y-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-700/30 border border-slate-600 rounded-lg p-5"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {member.name}
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(member.skills).map(([skill, level]) => (
                      <div key={skill}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-300">
                            {skill}
                          </span>
                          <select
                            value={level}
                            onChange={(e) =>
                              handleUpdateSkill(
                                member.id,
                                skill,
                                e.target.value
                              )
                            }
                            className="text-sm font-semibold text-slate-400 bg-slate-700 border border-slate-600 rounded px-2 py-1"
                          >
                            {[1, 2, 3, 4, 5].map((l) => (
                              <option key={l} value={l}>
                                {l}/5
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              level >= 5
                                ? 'bg-purple-500'
                                : level >= 4
                                ? 'bg-blue-500'
                                : level >= 3
                                ? 'bg-cyan-500'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${(level / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* メンバー管理 */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">メンバー管理</h2>
              {!showMemberForm && (
                <button
                  onClick={() => {
                    setShowMemberForm(true);
                    setEditingMember(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  メンバーを追加
                </button>
              )}
            </div>

            {showMemberForm && (
              <MemberForm
                member={editingMember}
                onSubmit={handleSaveMember}
                onCancel={() => {
                  setShowMemberForm(false);
                  setEditingMember(null);
                }}
              />
            )}

            <div className="grid gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-700/30 border border-slate-600 rounded-lg p-5 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {member.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      スキル数: {Object.keys(member.skills).length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setShowMemberForm(true);
                      }}
                      className="p-2 hover:bg-slate-600 rounded transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 hover:bg-red-600/20 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 案件フォームコンポーネント
const ProjectForm = ({ project, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    project || {
      name: '',
      customer: '',
      confidence: 'B',
      startMonth: '2026-06',
      duration: 3,
      requiredManMonths: 10,
      requiredSkills: [],
    }
  );
  const [skillInput, setSkillInput] = useState('');
  const allSkills = [
    'Java', 'JavaScript', 'TypeScript', 'Python', 'Node.js', 'React',
    'React Native', 'AWS', 'DevOps', 'Kubernetes', 'SQL', 'Tableau',
    'UI/UX', 'PM'
  ];

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {project ? '案件を編集' : '新規案件を追加'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">案件名</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
            placeholder="案件名を入力"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">顧客名</label>
          <input
            type="text"
            value={formData.customer}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
            placeholder="顧客名を入力"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">確度</label>
          <select
            value={formData.confidence}
            onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">開始時期</label>
          <input
            type="month"
            value={formData.startMonth}
            onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">期間（ヶ月）</label>
          <input
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">必要工数（人月）</label>
          <input
            type="number"
            min="1"
            value={formData.requiredManMonths}
            onChange={(e) =>
              setFormData({ ...formData, requiredManMonths: parseInt(e.target.value) })
            }
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">求めるスキル</label>
        <div className="flex gap-2 mb-3">
          <select
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="">スキルを選択</option>
            {allSkills
              .filter((s) => !formData.requiredSkills.includes(s))
              .map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
          </select>
          <button
            onClick={() => {
              if (skillInput && !formData.requiredSkills.includes(skillInput)) {
                setFormData({
                  ...formData,
                  requiredSkills: [...formData.requiredSkills, skillInput],
                });
                setSkillInput('');
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            追加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.requiredSkills.map((skill) => (
            <div
              key={skill}
              className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm flex items-center gap-2"
            >
              {skill}
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    requiredSkills: formData.requiredSkills.filter(
                      (s) => s !== skill
                    ),
                  })
                }
                className="hover:text-blue-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSubmit(formData)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

// メンバーフォームコンポーネント
const MemberForm = ({ member, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    member || {
      name: '',
    }
  );

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {member ? 'メンバーを編集' : '新規メンバーを追加'}
      </h3>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">メンバー名</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
            placeholder="メンバー名を入力"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onSubmit(formData)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default ResourceAllocationApp;
